// @ts-check
import { parse } from '@babel/parser';
import traverseImport from '@babel/traverse';
import generateImport from '@babel/generator';
import * as t from '@babel/types';
import { glob, readFile } from 'fs/promises';
import path from 'path';

/**
 * @typedef {Object} TransformationState
 * @property {Array<t.ImportDeclaration>} importsToAdd - Imports to be added at the top
 * @property {string|null} componentName - Name of the default export component
 * @property {boolean} hasDefaultExport - Whether a default export has been found
 * @property {string|null} createElementName - Unique name for createElement import
 */

/** @type {typeof traverseImport} */
const traverse = traverseImport.default || traverseImport;
const generate = generateImport.default || generateImport;

async function fromAsync(iterable, mapFn, thisArg) {
  const result = [];
  let i = 0;

  for await (const item of iterable) {
    result.push(mapFn ? mapFn.call(thisArg, item, i++) : item);
  }

  return result;
}

async function processDemo(source, resourcePath, addDependency) {
  // Parse the source code into AST
  const ast = parse(source, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx'],
  });

  /**
   * State for the transformation
   * @type {TransformationState}
   */
  const transformationState = {
    importsToAdd: [],
    componentName: null,
    hasDefaultExport: false,
    createElementName: null,
  };

  // Transform the AST using proper visitor pattern
  traverse(
    ast,
    {
      ExportDefaultDeclaration(path, state) {
        if (state.hasDefaultExport) {
          throw new Error(
            'Multiple default exports found. Only one default export is allowed.',
          );
        }

        state.hasDefaultExport = true;
        const declaration = path.node.declaration;

        if (t.isTSDeclareFunction(declaration)) {
          return;
        } else if (t.isFunctionDeclaration(declaration)) {
          if (!declaration.id || !declaration.id.name) {
            throw new Error(
              'Default export function must have a name (e.g., "export default function ComponentName()")',
            );
          }
          state.componentName = declaration.id.name;
        } else if (t.isIdentifier(declaration)) {
          // Identifier - use identifier name
          state.componentName = declaration.name;
        } else {
          let expression = t.isClassDeclaration(declaration)
            ? t.toExpression(declaration)
            : declaration;
          // Other expression - assign to variable
          const uniqueId = path.scope.generateUidIdentifier('Component');
          state.componentName = uniqueId.name;
          // Transform: export default expr → const _Component = expr; export default _Component;
          path.replaceWithMultiple([
            t.variableDeclaration('const', [
              t.variableDeclarator(uniqueId, expression),
            ]),
            t.exportDefaultDeclaration(uniqueId),
          ]);
        }
      },

      ExportNamedDeclaration(path, state) {
        const node = path.node;

        // Handle: export { default } from '.' and export { Foo as default } from './bar'
        if (node.source && node.specifiers) {
          for (const spec of node.specifiers) {
            if (
              t.isExportSpecifier(spec) &&
              (t.isIdentifier(spec.exported, { name: 'default' }) ||
                t.isLiteral(spec.exported, { value: 'default' }))
            ) {
              if (state.hasDefaultExport) {
                throw new Error(
                  'Multiple default exports found. Only one default export is allowed.',
                );
              }

              state.hasDefaultExport = true;

              if (spec.local.name === 'default') {
                // export { default } from '.'
                const uniqueId = path.scope.generateUidIdentifier('Demo');
                state.componentName = uniqueId.name;

                // Create import: import Demo from '.'
                state.importsToAdd.push(
                  t.importDeclaration(
                    [t.importDefaultSpecifier(uniqueId)],
                    node.source,
                  ),
                );

                // Replace with: export default Demo
                path.replaceWith(t.exportDefaultDeclaration(uniqueId));
              } else {
                // export { Foo as default } from './bar'
                const uniqueId = path.scope.generateUidIdentifier(
                  spec.local.name,
                );
                state.componentName = uniqueId.name;

                // Create import: import { Foo } from './bar'
                state.importsToAdd.push(
                  t.importDeclaration(
                    [
                      t.importSpecifier(
                        uniqueId,
                        t.identifier(spec.local.name),
                      ),
                    ],
                    node.source,
                  ),
                );

                // Replace with: export default Foo
                path.replaceWith(t.exportDefaultDeclaration(uniqueId));
              }
              break;
            }
          }
        }
      },

      Program: {
        exit(path, state) {
          // Generate unique identifier for createElement to avoid conflicts
          const createElementId =
            path.scope.generateUidIdentifier('createElement');
          state.createElementName = createElementId.name;

          // Add React createElement import with unique name
          const reactImport = t.importDeclaration(
            [t.importSpecifier(createElementId, t.identifier('createElement'))],
            t.stringLiteral('react'),
          );

          // Add all imports at the top level after all transformations
          const allImports = [reactImport, ...state.importsToAdd];
          if (allImports.length > 0) {
            path.unshiftContainer('body', allImports);
          }
        },
      },
    },
    undefined,
    transformationState,
  );

  if (!transformationState.hasDefaultExport) {
    throw new Error(
      'No default export found. File must have exactly one default export.',
    );
  }

  const componentName = transformationState.componentName;

  // Get the directory containing the current file
  const fileDir = path.dirname(resourcePath);

  // Collect all file paths first
  const filePaths = await fromAsync(glob('**/*', { cwd: fileDir }));

  // Read all files in parallel
  const fileReadPromises = filePaths.map(async (filePath) => {
    const fullPath = path.join(fileDir, filePath);
    addDependency(fullPath);
    const content = await readFile(fullPath, 'utf-8');
    return [filePath, content];
  });

  const allFileEntries = await Promise.all(fileReadPromises);

  // Filter out the current file being processed
  const currentFileName = path.basename(resourcePath);
  const fileEntries = allFileEntries.filter(
    ([filePath]) => filePath !== currentFileName,
  );

  // Generate source from transformed AST
  const { code: rewrittenSource } = generate(ast);

  const enhancedSource = `
${rewrittenSource}

// Enhanced exports for demo loader

export const element = ${transformationState.createElementName}(${componentName});

export const files = new Map(${JSON.stringify(fileEntries)});
`;

  return enhancedSource;
}

export default function demoLoader(source) {
  const callback = this.async();

  // Add dependency for the main resource file
  this.addDependency(this.resourcePath);

  processDemo(source, this.resourcePath, this.addDependency).then(
    (result) => callback(null, result),
    (error) => callback(error),
  );
}

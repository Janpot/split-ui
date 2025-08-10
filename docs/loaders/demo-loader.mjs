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
 * @property {string|null} createElementName - Unique name for createElement import
 */

/** @type {typeof traverseImport} */
// @ts-expect-error Faulty type declarations
const traverse = traverseImport.default || traverseImport;
/** @type {typeof generateImport} */
// @ts-expect-error Faulty type declarations
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
    createElementName: null,
  };

  // Transform the AST using proper visitor pattern
  traverse(
    ast,
    {
      ExportDefaultDeclaration(path, state) {
        const declaration = path.node.declaration;
        if (t.isTSDeclareFunction(declaration)) {
          return;
        }

        if (state.componentName) {
          throw new Error(
            'Multiple default exports found. Only one default export is allowed.',
          );
        }

        const identifier = t.isIdentifier(declaration)
          ? declaration
          : t.isFunctionDeclaration(declaration) && declaration.id
            ? declaration.id
            : null;
        if (identifier) {
          state.componentName = identifier.name;
        } else {
          // Other expression (including anonymous functions) - assign to variable
          const uniqueId = path.scope.generateUidIdentifier('Component');
          state.componentName = uniqueId.name;
          // Transform: export default expr → const _Component = expr; export default _Component;
          path.replaceWithMultiple([
            t.variableDeclaration('const', [
              t.variableDeclarator(uniqueId, t.toExpression(declaration)),
            ]),
            t.exportDefaultDeclaration(uniqueId),
          ]);
        }
      },

      ExportNamedDeclaration(path, state) {
        const node = path.node;

        // Handle: export { default } from '.' and export { Foo as default } from './bar'
        // Only add imports and set state - keep original export statements unchanged
        if (node.source && node.specifiers) {
          for (const spec of node.specifiers) {
            if (
              t.isExportNamespaceSpecifier(spec) &&
              spec.exported.name === 'default'
            ) {
              throw new Error(
                'Exporting namespace as default is not allowed. Default export must be a React component.',
              );
            }

            if (
              t.isExportSpecifier(spec) &&
              (t.isIdentifier(spec.exported, { name: 'default' }) ||
                t.isLiteral(spec.exported, { value: 'default' }))
            ) {
              // Found default export specifier
              let uniqueId, importDecl;

              if (spec.local.name === 'default') {
                // export { default } from '.'
                uniqueId = path.scope.generateUidIdentifier('Demo');
                importDecl = t.importDeclaration(
                  [t.importDefaultSpecifier(uniqueId)],
                  node.source,
                );
              } else {
                // export { Foo as default } from './bar'
                uniqueId = path.scope.generateUidIdentifier(spec.local.name);
                importDecl = t.importDeclaration(
                  [t.importSpecifier(uniqueId, t.identifier(spec.local.name))],
                  node.source,
                );
              }

              // Add import and set state
              state.importsToAdd.push(importDecl);
              state.componentName = uniqueId.name;
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
          path.unshiftContainer('body', [reactImport, ...state.importsToAdd]);
        },
      },
    },
    undefined,
    transformationState,
  );

  const { componentName } = transformationState;

  if (!componentName) {
    throw new Error(
      'No default export found. File must have exactly one default export.',
    );
  }

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
  const filteredEntries = allFileEntries.filter(
    ([filePath]) => filePath !== currentFileName,
  );

  // Sort files so index.tsx is always first
  const fileEntries = filteredEntries.sort(([a], [b]) => {
    if (a === 'index.tsx') return -1;
    if (b === 'index.tsx') return 1;
    return a.localeCompare(b);
  });

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

// @ts-check
import { parse } from '@babel/parser';
import traverseImport from '@babel/traverse';
import { glob, readFile } from 'fs/promises';
import path from 'path';

const traverse = traverseImport.default || traverseImport;

async function fromAsync(iterable, mapFn, thisArg) {
  const result = [];
  let i = 0;

  for await (const item of iterable) {
    result.push(mapFn ? mapFn.call(thisArg, item, i++) : item);
  }

  return result;
}

async function processDemo(source, resourcePath) {
  // Parse the source code into AST
  const ast = parse(source, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx'],
  });

  let defaultExport = null;
  let componentName = null;

  // Find and validate the default export
  traverse(ast, {
    ExportDefaultDeclaration(path) {
      if (defaultExport) {
        throw new Error(
          'Multiple default exports found. Only one default export is allowed.',
        );
      }

      defaultExport = path.node.declaration;

      // Check if it's a function declaration
      if (defaultExport.type === 'FunctionDeclaration') {
        if (!defaultExport.id || !defaultExport.id.name) {
          throw new Error(
            'Default export function must have a name (e.g., "export default function ComponentName()")',
          );
        }
        componentName = defaultExport.id.name;
      } else {
        throw new Error(
          'Default export must be a function declaration (e.g., "export default function ComponentName()")',
        );
      }
    },
  });

  if (!defaultExport) {
    throw new Error(
      'No default export found. File must have exactly one default export function.',
    );
  }

  // Get the directory containing the current file
  const fileDir = path.dirname(resourcePath);

  // Collect all file paths first
  const filePaths = await fromAsync(glob('**/*', { cwd: fileDir }));

  // Read all files in parallel
  const fileReadPromises = filePaths.map(async (filePath) => {
    const fullPath = path.join(fileDir, filePath);
    const content = await readFile(fullPath, 'utf-8');
    return [filePath, content];
  });

  const fileEntries = await Promise.all(fileReadPromises);

  const enhancedSource = `
${source}

// Enhanced exports for demo loader
import React from 'react';

export const element = React.createElement(${componentName});

export const files = new Map(${JSON.stringify(fileEntries)});
`;

  return enhancedSource;
}

export default function demoLoader(source) {
  const callback = this.async();

  processDemo(source, this.resourcePath).then(
    (result) => callback(null, result),
    (error) => callback(error),
  );
}

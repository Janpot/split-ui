import { defineConfig, globalIgnores } from 'eslint/config';
import eslint from '@eslint/js';
import nextTypescript from 'eslint-config-next/typescript';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactCompiler from 'eslint-plugin-react-compiler';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores([
    '**/dist/**/*',
    '**/.next/**/*',
    '**/next.config.js',
    // https://github.com/vercel/next.js/issues/82828
    'docs/next-env.d.ts',
  ]),
  eslint.configs.recommended,
  tseslint.configs.recommended,
  reactHooks.configs.flat['recommended-latest'],
  {
    ...reactPlugin.configs.flat.recommended,
    settings: { react: { version: 'detect' } },
    rules: {
      'react/no-unescaped-entities': ['error', { forbid: ['>', '}'] }],
    },
  },
  reactPlugin.configs.flat['jsx-runtime'],
  reactCompiler.configs.recommended,
  {
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "ImportDeclaration[source.value='react'][specifiers.0.type='ImportDefaultSpecifier']",
          message:
            'Default React import not allowed. Use `import * as React from "react"` or named imports instead.',
        },
      ],
    },
  },
  ...nextTypescript,
  {
    settings: {
      next: {
        rootDir: 'docs/',
      },
    },
  },
]);

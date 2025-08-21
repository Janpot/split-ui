import { defineConfig, globalIgnores } from 'eslint/config';
import eslint from '@eslint/js';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactCompiler from 'eslint-plugin-react-compiler';
import tseslint from 'typescript-eslint';
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({
  // import.meta.dirname is available after Node.js v20.11.0
  baseDirectory: import.meta.dirname,
});

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

  reactHooks.configs.recommended,
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

  ...compat.config({
    extends: ['next/typescript'],
    settings: {
      next: {
        rootDir: 'docs/',
      },
    },
  }),
]);

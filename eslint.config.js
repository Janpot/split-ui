import { defineConfig, globalIgnores } from 'eslint/config';
import eslint from '@eslint/js';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactCompiler from 'eslint-plugin-react-compiler';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['**/dist/**/*', '**/.next/**/*', '**/next.config.js']),
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
]);

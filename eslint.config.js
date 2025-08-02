import { defineConfig, globalIgnores } from 'eslint/config';
import eslint from '@eslint/js';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactCompiler from 'eslint-plugin-react-compiler';
import tseslint from 'typescript-eslint';
// import { FlatCompat } from "@eslint/eslintrc";

// const compat = new FlatCompat({ baseDirectory: import.meta.url });

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

  // Next.js specific config for docs package
  // ...compat.config({
  //   extends: ['next/typescript'],
  //   settings: {
  //     next: {
  //       rootDir: 'docs',
  //     },
  //   },
  // }),
]);

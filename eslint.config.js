import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactCompiler from "eslint-plugin-react-compiler";

import tseslint from "typescript-eslint";

const compat = new FlatCompat({
  baseDirectory: import.meta.url,
});

export default [
  // Common ignores
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/.turbo/**",
    ],
  },

  {
    settings: {
      react: {
        version: "19",
      },
    },
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  reactCompiler.configs.recommended,
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat["jsx-runtime"],
  reactHooks.configs["recommended-latest"],

  // Next.js specific config for docs package
  ...compat.config({
    extends: ["next/typescript"],
    settings: {
      next: {
        rootDir: "docs",
      },
    },
  }),
];

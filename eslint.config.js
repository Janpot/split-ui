import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

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

  js.configs.recommended,
  ...tseslint.configs.recommended,
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

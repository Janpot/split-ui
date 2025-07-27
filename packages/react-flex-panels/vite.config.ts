import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import preserveDirectives from "rollup-plugin-preserve-directives";
import { externalizeDeps } from "vite-plugin-externalize-deps";
import { resolve } from "path";
import * as fs from "fs/promises";

import pkg from "./package.json";

const PKG_TYPE: "module" | "commonjs" =
  pkg.type === "module" ? "module" : "commonjs";

const CJS_EXT = PKG_TYPE === "commonjs" ? ".js" : ".cjs";
const ESM_EXT = PKG_TYPE === "module" ? ".js" : ".mjs";
const DTS_RENAME_EXT = PKG_TYPE === "module" ? ".d.cts" : ".d.mts";

export default defineConfig({
  plugins: [
    externalizeDeps(),
    preserveDirectives(),
    react({
      jsxImportSource: "react",
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
    dts({
      insertTypesEntry: true,
      include: ["src/**/*"],
      exclude: ["src/**/*.test.*", "src/**/*.spec.*"],
      afterBuild: async () => {
        // Fetch all .d.ts files recursively from the dist directory
        const files = await fs.glob("dist/**/*.d.{ts,ts.map}");

        for await (const file of files) {
          const newFilePath = file.replace(
            /\.d\.ts(\.map)?$/,
            `${DTS_RENAME_EXT}$1`,
          );
          await fs.cp(file, newFilePath);

          // Update sourceMappingURL references
          if (newFilePath.endsWith(DTS_RENAME_EXT)) {
            const content = await fs.readFile(newFilePath, "utf-8");
            const updatedContent = content.replace(
              /\/\/# sourceMappingURL=.*\.d\.ts\.map/g,
              (match) => match.replace(".d.ts.map", `${DTS_RENAME_EXT}.map`),
            );
            await fs.writeFile(newFilePath, updatedContent, "utf-8");
          }

          // Update source map file references
          if (newFilePath.endsWith(`${DTS_RENAME_EXT}.map`)) {
            const content = await fs.readFile(newFilePath);
            const jsonContent = JSON.parse(content.toString());
            jsonContent.file = jsonContent.file.replace(".d.ts", ".d.mts");
            await fs.writeFile(
              newFilePath,
              JSON.stringify(jsonContent),
              "utf-8",
            );
          }

          // TODO: resolve extensions for ESM declarations
        }
      },
    }),
  ],
  build: {
    minify: false,
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      formats: ["es", "cjs"],
      fileName: (format, entryName) =>
        `${entryName}${format === "cjs" ? CJS_EXT : ESM_EXT}`,
    },
    sourcemap: true,
    rollupOptions: {
      output: {
        preserveModules: true,
        preserveModulesRoot: "src",
      },
    },
  },
  test: {
    browser: {
      enabled: true,
      instances: [
        {
          browser: "chromium",
        },
      ],
      provider: "playwright",
      // Run tests in headless mode
      headless: true,
    },
  },
});

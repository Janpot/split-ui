import { defineConfig } from 'tsdown';
import * as fs from 'fs/promises';

export default defineConfig({
  format: ['esm', 'cjs'],
  entry: ['./src/index.ts'],
  exports: {
    async customExports(exports) {
      const cssFiles = await fs.glob('**/*.css', { cwd: './src' });
      for await (const file of cssFiles) {
        exports[`./${file}`] = `./dist/${file}`;
      }
      return exports;
    },
  },
  copy: ['./src/**/*.css'],
  unused: { depKinds: ['dependencies'] },
  publint: true,
  attw: {
    excludeEntrypoints: [/.*\.css/],
  },
});

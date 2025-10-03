import { defineConfig } from 'tsdown';
import * as fs from 'fs/promises';

export default defineConfig({
  format: ['esm', 'cjs'],
  entry: ['src/index.ts', 'src/styles.css'],
  exports: {
    async customExports(exports) {
      const styles = await fs.readdir('src/public');
      for (const file of styles) {
        exports[`./${file}`] = `./dist/${file}`;
      }
      return exports;
    },
  },
  attw: {
    excludeEntrypoints: [/\.css$/],
  },
  copy: [{ from: 'src/public', to: 'dist' }],
  unused: { depKinds: ['dependencies'] },
  publint: true,
});

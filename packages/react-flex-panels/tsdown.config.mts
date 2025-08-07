import { defineConfig } from 'tsdown';

export default defineConfig({
  format: ['esm', 'cjs'],
  entry: ['src/index.ts', 'src/styles.css'],
  exports: {
    customExports(exports) {
      exports['./styles.css'] = './dist/styles.css';
      delete exports['./styles'];
      return exports;
    },
  },
  attw: {
    excludeEntrypoints: ['./styles.css'],
  },
  unused: { depKinds: ['dependencies'] },
  publint: true,
});

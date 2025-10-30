import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import browserCommands from './browserCommands';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
  plugins: [react(), browserCommands()],
  test: {
    expect: {
      poll: {
        timeout: 1000,
      },
    },
    setupFiles: ['./setup-test.ts'],
    browser: {
      enabled: true,
      instances: [{ browser: 'chromium' }],
      provider: playwright({
        contextOptions: {
          hasTouch: true,
        },
      }),
      headless: true,
      viewport: { width: 1280, height: 720 },
    },
  },
});

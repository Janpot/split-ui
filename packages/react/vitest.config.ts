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
      instances: [
        { browser: 'chromium' },
        // { browser: 'firefox' },
        // { browser: 'webkit' },
      ],
      provider: playwright({
        contextOptions: {
          hasTouch: true,
        },
        // Remove when https://github.com/vitest-dev/vitest/issues/8308#issuecomment-3704601263 gets fixed
        actionTimeout: 1000,
      }),
      headless: true,
      viewport: { width: 1280, height: 720 },
      screenshotFailures: false,
    },
  },
});

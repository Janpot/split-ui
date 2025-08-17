import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import * as browserCommands from './browserCommands';

export default defineConfig({
  plugins: [react()],
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
        {
          browser: 'chromium',
          context: { hasTouch: true },
        },
      ],
      provider: 'playwright',
      commands: browserCommands,
      headless: true,
      viewport: { width: 1280, height: 720 },
    },
  },
});

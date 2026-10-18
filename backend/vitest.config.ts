import { defineConfig } from 'vitest/config';
import { TEST_DATABASE_URL } from './tests/test-env';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    globalSetup: ['./tests/global-setup.ts'],
    setupFiles: ['./tests/setup.ts'],
    fileParallelism: false,
    hookTimeout: 60000,
    testTimeout: 30000,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: TEST_DATABASE_URL,
    },
  },
});

import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    exclude: ['**/node_modules/**', 'backend/**'],
  },
  resolve: {
    alias: [
      { find: 'react-native', replacement: resolve(__dirname, 'test/vitest/react-native.ts') },
      { find: 'expo-router', replacement: resolve(__dirname, 'test/vitest/expo-router.ts') },
      { find: '@', replacement: resolve(__dirname, 'src') },
    ],
  },
});

import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

/**
 * Unit tests cover pure logic only — domain rules, the offline queue, coordinate
 * math. Anything that touches native modules is covered by component tests
 * (React Native Testing Library) and E2E (Detox) instead, so this suite stays fast
 * and needs no native runtime.
 */
export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    exclude: ['**/node_modules/**', 'backend/**'],
  },
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
});

// drizzle-kit — отдельный процесс, .env ему тоже нужен.
import './src/config/load-env';

import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/database/schema/index.ts',
  out: './src/database/migrations',
  dbCredentials: {
    url: process.env['DATABASE_URL'] ?? 'postgres://lumi:lumi@localhost:5432/lumi',
  },
  strict: true,
  verbose: true,
});

import { index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

/**
 * Durable replay record for retryable mutations.
 *
 * The key is scoped to the authenticated principal and operation, so a client
 * cannot replay another user's result. `requestHash` prevents reusing a key
 * with a different payload. The stored response is the canonical HTTP result.
 */
export const idempotencyRecords = pgTable(
  'idempotency_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    scope: text('scope').notNull(),
    key: text('key').notNull(),
    requestHash: text('request_hash').notNull(),
    response: jsonb('response').notNull(),
    statusCode: integer('status_code').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex('idempotency_scope_key_unique').on(table.scope, table.key),
    index('idempotency_expires_idx').on(table.expiresAt),
  ],
);

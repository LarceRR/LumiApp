# Twilite foundation contracts

> Issue: #28

## Error contract

Every HTTP error uses one envelope:

```json
{
  "kind": "conflict",
  "code": "CONFLICT",
  "message": "Безопасное сообщение для пользователя",
  "details": {},
  "requestId": "request-id"
}
```

Clients branch on the stable `code`, never on `message`. The current registry is `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `CONFLICT` (409), `VALIDATION_FAILED` (400), `DOMAIN_RULE_VIOLATION` (422), `INFRASTRUCTURE_UNAVAILABLE` (503) and `INTERNAL_ERROR` (500).

`requestId` is safe correlation metadata. Error details must never contain tokens, passwords, raw user content or provider payloads.

## Ownership and visibility invariants

- The authenticated backend principal is the only source of owner, author, membership and role.
- Space membership and object visibility are checked at the application boundary for every read, mutation and realtime subscription.
- Client-provided ownership, role, subscription, coordinates and visibility claims are never authoritative.
- Database foreign keys, unique indexes and optimistic-lock versions enforce invariants that must survive concurrent requests.

## Configuration invariants

- Configuration is validated at boot and the process fails closed on an invalid environment.
- Configuration errors report variable names and reasons only. Environment values (secrets, connection strings, tokens) are never printed to stdout, stderr or a log sink.

## Idempotency policy

Retryable mutations accept an idempotency key at the HTTP boundary. The key is scoped to the authenticated principal and operation. The backend stores the request hash and canonical response in `idempotency_records`.

1. Validate the key before business logic.
2. Hash the validated body and route scope.
3. Same `(scope, key)` and same hash returns the stored status and response.
4. Same key with a different hash returns `409 CONFLICT` and performs no mutation.
5. A new key first creates a pending reservation under the unique `(scope, key)` constraint, then executes the mutation and marks the reservation completed with the canonical response.
6. A concurrent caller that loses the reservation race does not execute the mutation and receives a stable conflict instead.
7. Pending reservations expire after 24 hours for crash recovery; completed records also expire after 24 hours and are removed by scheduled cleanup.

Required for registration, space creation, invitation creation/acceptance, moment mutations, exports, deletion requests and billing webhooks. GET/HEAD requests are already safe to retry.

## Database migration policy

Schema changes require a forward migration beside the schema change, a recovery note for incompatible changes, CI application against empty and representative existing databases, and verification that constraints/indexes exist after migration.

Migrations `0001_foundation_idempotency.sql` and `0002_idempotency_reservations.sql` add the durable replay table and pending/completed reservation state. Both are additive/forward migrations; cleanup of expired records is a separate operational task.

## Schema contract and verification

A green `db:migrate` only proves that SQL executed. The schema invariants themselves are declared in `backend/src/database/migrations/schema-contract.ts`:

- every expected table and primary key, including the composite `space_members` key that blocks duplicate membership;
- every foreign key together with its `ON DELETE` rule, because cascade/set-null behaviour is part of the deletion and anonymisation contract (#40, #74);
- every unique and partial index that encodes a domain invariant (one surface per space, one object per cell, one pending invitation per space/email, one `(scope, key)` idempotency record);
- nullability of the columns that migrations changed, so a half-applied `0002` fails in CI instead of at runtime.

Two independent checks use that contract:

1. `npm test` (`schema-contract.spec.ts`) asserts the contract matches the migration SQL, so schema drift cannot land silently. No database required.
2. `npm run db:verify` inspects the live database (`information_schema`, `pg_constraint`, `pg_index`) and the `drizzle.__drizzle_migrations` journal, then fails with the list of missing or incorrect objects. Output contains object names only, never the connection string or row data.

### Migration recovery

CI runs the sequence `db:migrate → db:verify → db:migrate → db:verify`: the first pair covers an empty database, the second proves migrations are re-appliable against an already migrated database and that re-application does not drop or weaken constraints.

If verification fails, the deploy stops before traffic. Recovery is forward-only: add a new migration that restores the missing object, re-run `db:migrate` and `db:verify`. Never hand-edit an applied migration file, because the journal count check would then diverge from the migration folder.

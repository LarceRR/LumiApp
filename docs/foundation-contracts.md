# Lumi foundation contracts

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

## Idempotency policy

Retryable mutations accept an idempotency key at the HTTP boundary. The key is scoped to the authenticated principal and operation. The backend stores the request hash and canonical response in `idempotency_records`.

1. Validate the key before business logic.
2. Hash the validated body and route scope.
3. Same `(scope, key)` and same hash returns the stored status and response.
4. Same key with a different hash returns `409 CONFLICT` and performs no mutation.
5. A new key executes the mutation and persists the response in the same database transaction.
6. The unique `(scope, key)` constraint resolves concurrent first requests; the loser rereads the winner's record.
7. Records expire by `expiresAt` and are removed by scheduled cleanup. The retention window is operation-specific and must be configured before production.

Required for registration, space creation, invitation creation/acceptance, moment mutations, exports, deletion requests and billing webhooks. GET/HEAD requests are already safe to retry.

## Migration policy

Schema changes require a forward migration beside the schema change, a recovery note for incompatible changes, CI application against empty and representative existing databases, and verification that constraints/indexes exist after migration.

Migration `0001_foundation_idempotency.sql` is additive and safe to roll forward. Cleanup of expired records is a separate operational task.

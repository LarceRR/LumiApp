export const storageKeys = {
  authSession: 'lumi.auth.session',
  spacesSnapshot: 'lumi.spaces.snapshot',
  localStateSchema: 'lumi.local-state.schema',
  surfaceObjects: 'lumi.surface-objects',
  timeline: 'lumi.timeline',
  offlineQueue: 'lumi.offline-queue',
  settings: 'lumi.settings',
  fireSettings: 'lumi.fire-settings',
  queryCache: 'lumi.query-cache',
} as const;

export const httpConfig = { timeoutMs: 15_000, retryLimit: 2 } as const;
export const realtimeConfig = {
  reconnectBaseDelayMs: 500,
  reconnectMaxDelayMs: 15_000,
  heartbeatIntervalMs: 25_000,
} as const;
export const cacheConfig = {
  activeSpaceTtlMs: 30_000,
  surfaceStaleMs: 15_000,
  timelineStaleMs: 60_000,
  profileStaleMs: 10 * 60_000,
  timelinePageSize: 30,
} as const;
export const offlineQueueConfig = {
  maxAttempts: 5,
  backoffBaseMs: 1_000,
  backoffMaxMs: 60_000,
} as const;

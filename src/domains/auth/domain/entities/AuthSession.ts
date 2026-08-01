import type { UserId } from '../value-objects/UserId';

/**
 * Tokens never leave the auth infrastructure: use cases pass the session
 * around, presentation only ever sees `userId` and `isExpired`.
 */
export type AuthSession = {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresAt: number;
  readonly userId: UserId;
};

/** Refresh slightly early so an in-flight request never races the expiry. */
const REFRESH_SKEW_MS = 30_000;

export function isSessionExpired(session: AuthSession, now: number): boolean {
  return session.expiresAt - REFRESH_SKEW_MS <= now;
}

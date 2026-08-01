import type { AuthSession } from '../entities/AuthSession';
import type { UserProfile } from '../entities/UserProfile';
import type { Email } from '../value-objects/Email';

export type OAuthProvider = 'apple' | 'google';

export type SignInCredentials =
  | { readonly type: 'email'; readonly email: Email; readonly password: string }
  | { readonly type: 'oauth'; readonly provider: OAuthProvider; readonly idToken: string };

export type SignUpCredentials = {
  readonly email: Email;
  readonly password: string;
  readonly displayName: string;
};

export type AuthRepository = {
  signIn(credentials: SignInCredentials): Promise<AuthSession>;
  signUp(credentials: SignUpCredentials): Promise<AuthSession>;
  refresh(refreshToken: string): Promise<AuthSession>;
  signOut(session: AuthSession): Promise<void>;
  profile(session: AuthSession): Promise<UserProfile>;
};

/** Secure Store port: the only place raw tokens are persisted. */
export type SessionStorage = {
  read(): Promise<AuthSession | null>;
  write(session: AuthSession): Promise<void>;
  clear(): Promise<void>;
};

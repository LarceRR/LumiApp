export type AuthSessionDto = {
  readonly accessToken: string;
  readonly refreshToken: string;
  /** ISO-8601 */
  readonly expiresAt: string;
  readonly userId: string;
};

export type SignInRequestDto =
  | { readonly type: 'email'; readonly email: string; readonly password: string }
  | { readonly type: 'oauth'; readonly provider: 'apple' | 'google'; readonly idToken: string };

export type SignUpRequestDto = {
  readonly email: string;
  readonly password: string;
  readonly displayName: string;
};

export type RefreshSessionRequestDto = {
  readonly refreshToken: string;
};

export type UserProfileDto = {
  readonly id: string;
  readonly email: string | null;
  readonly displayName: string;
  readonly avatarUrl: string | null;
};

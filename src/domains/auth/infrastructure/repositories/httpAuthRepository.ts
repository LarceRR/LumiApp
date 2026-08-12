import type { HttpClient } from '@/infrastructure/http/httpClient';
import type { AuthSessionDto, UserProfileDto } from '@/shared/contracts';

import type { AuthRepository } from '../../domain/repositories/AuthRepository';
import { toAuthSession, toUserProfile } from '../mappers/authMapper';

export function createHttpAuthRepository(http: HttpClient): AuthRepository {
  return {
    async signIn(credentials) {
      console.log(credentials);
      const body =
        credentials.type === 'email'
          ? { type: 'email', email: credentials.email, password: credentials.password }
          : { type: 'oauth', provider: credentials.provider, idToken: credentials.idToken };

      return toAuthSession(await http.post<AuthSessionDto>('auth/sign-in', body));
    },

    async signUp(credentials) {
      console.log(credentials);
      return toAuthSession(
        await http.post<AuthSessionDto>('auth/sign-up', {
          email: credentials.email,
          password: credentials.password,
          displayName: credentials.displayName,
        }),
      );
    },

    async refresh(refreshToken) {
      return toAuthSession(await http.post<AuthSessionDto>('auth/refresh', { refreshToken }));
    },

    async signOut() {
      await http.post('auth/sign-out');
    },

    async profile() {
      return toUserProfile(await http.get<UserProfileDto>('auth/me'));
    },
  };
}

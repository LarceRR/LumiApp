import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

import { useAuthStore } from '@/domains/auth/presentation/stores/authStore';

/** Routes reachable without a session. Everything else is gated. */
const PUBLIC_SEGMENTS: readonly string[] = ['sign-in', 'sign-up'];

function isPublicRoute(segments: readonly string[]): boolean {
  return segments.some((segment) => PUBLIC_SEGMENTS.includes(segment));
}

/**
 * Single redirect rule for the whole app.
 *
 * Placing this on the root navigator rather than on each screen means a new
 * route is gated by default — the failure mode of a per-screen guard is that
 * someone adds a screen and forgets.
 *
 * Nothing happens until bootstrap has finished and auth has left `restoring`,
 * otherwise a cold start would redirect to sign-in before the stored session
 * has had a chance to load.
 */
export function useAuthGuard(isReady: boolean): void {
  const router = useRouter();
  const segments = useSegments();
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    if (!isReady || status === 'restoring') {
      return;
    }

    const onPublicRoute = isPublicRoute(segments);

    if (status === 'anonymous' && !onPublicRoute) {
      router.replace('/sign-in');

      return;
    }

    if (status === 'authenticated' && onPublicRoute) {
      router.replace('/');
    }
  }, [isReady, status, segments, router]);
}

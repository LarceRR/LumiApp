/** Route names, kept in one place so navigation calls are not stringly typed. */
export const routes = {
  space: '/',
  timeline: '/timeline',
  ai: '/ai',
  profile: '/profile',
  settings: '/settings',
  billing: '/billing',
  signIn: '/sign-in',
  signUp: '/sign-up',
} as const;

export type RouteName = keyof typeof routes;
export type RoutePath = (typeof routes)[RouteName];

import Constants from 'expo-constants';

export type AppMode = 'development' | 'staging' | 'production';

type RawExtra = {
  readonly apiBaseUrl?: unknown;
  readonly websocketUrl?: unknown;
  readonly sentryDsn?: unknown;
  readonly posthogApiKey?: unknown;
  readonly posthogHost?: unknown;
  readonly mode?: unknown;
};

export type Env = {
  readonly mode: AppMode;
  readonly isDev: boolean;
  /** Absent means the app runs fully on local adapters (offline-first sandbox). */
  readonly apiBaseUrl: string | null;
  readonly websocketUrl: string | null;
  readonly sentryDsn: string | null;
  readonly posthogApiKey: string | null;
  readonly posthogHost: string;
};

const DEFAULT_POSTHOG_HOST = 'https://eu.i.posthog.com';

function readExtra(): RawExtra {
  const extra = Constants.expoConfig?.extra;

  return typeof extra === 'object' && extra !== null ? (extra as RawExtra) : {};
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function resolveMode(value: unknown): AppMode {
  if (value === 'production' || value === 'staging' || value === 'development') {
    return value;
  }

  return __DEV__ ? 'development' : 'production';
}

function createEnv(): Env {
  const extra = readExtra();
  const mode = resolveMode(extra.mode);

  return {
    mode,
    isDev: mode === 'development',
    apiBaseUrl: asString(extra.apiBaseUrl),
    websocketUrl: asString(extra.websocketUrl),
    sentryDsn: asString(extra.sentryDsn),
    posthogApiKey: asString(extra.posthogApiKey),
    posthogHost: asString(extra.posthogHost) ?? DEFAULT_POSTHOG_HOST,
  };
}

export const env: Env = createEnv();

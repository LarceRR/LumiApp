import { beforeEach, describe, expect, it, vi } from 'vitest';

const expoConstantsMock = {
  expoConfig: {
    extra: {},
    hostUri: '192.168.0.10:8081',
  },
};

vi.mock('expo-constants', () => ({
  default: expoConstantsMock,
}));

describe('env', () => {
  beforeEach(() => {
    vi.resetModules();
    (process.env as { NODE_ENV?: string }).NODE_ENV = 'development';
    expoConstantsMock.expoConfig = {
      extra: {},
      hostUri: '192.168.0.10:8081',
    };
  });

  it('derives the API URL from the Expo dev host when no explicit URL is configured', async () => {
    const { env } = await import('./env');

    expect(env.apiBaseUrl).toBe('http://192.168.0.10:3000/v1');
    expect(env.websocketUrl).toBe('ws://192.168.0.10:3000/realtime');
  });
});

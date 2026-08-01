import ky, { isHTTPError, isNetworkError, isTimeoutError, type KyInstance } from 'ky';

import { httpConfig } from '@/app/config/constants';
import { errorFromStatus, NetworkError, toAppError } from '@/shared/errors';
import type { Logger } from '@/shared/logger';

export type AccessTokenProvider = {
  /** Returns a valid access token, refreshing it first when needed. */
  token(): Promise<string | null>;
  /** Called after a 401 so the session is rotated at most once per request. */
  invalidate(): Promise<string | null>;
};

export type SearchParams = Readonly<Record<string, string | number>>;

export type HttpClient = {
  get<T>(path: string, searchParams?: SearchParams): Promise<T>;
  post<T>(path: string, body?: unknown): Promise<T>;
  patch<T>(path: string, body?: unknown): Promise<T>;
  delete(path: string, body?: unknown): Promise<void>;
};

/** ky pre-parses the error body into `error.data`, so no second read is needed. */
function describe(status: number, data: unknown): { message: string; body: unknown } {
  if (typeof data === 'object' && data !== null && 'message' in data) {
    const message = (data as { message: unknown }).message;

    if (typeof message === 'string') {
      return { message, body: data };
    }
  }

  if (typeof data === 'string' && data.length > 0) {
    return { message: data, body: data };
  }

  return { message: `Ошибка запроса (${status})`, body: data };
}

/**
 * The single place where transport failures become `AppError`s. Nothing above
 * this layer sees `Response`, ky errors or status codes.
 */
export function createHttpClient(options: {
  readonly baseUrl: string;
  readonly tokens: AccessTokenProvider;
  readonly logger: Logger;
}): HttpClient {
  const log = options.logger.child('http');

  const instance: KyInstance = ky.create({
    prefix: options.baseUrl,
    timeout: httpConfig.timeoutMs,
    retry: {
      limit: httpConfig.retryLimit,
      methods: ['get'],
      statusCodes: [408, 429, 500, 502, 503, 504],
    },
    hooks: {
      beforeRequest: [
        async ({ request }) => {
          const token = await options.tokens.token();

          if (token !== null) {
            request.headers.set('authorization', `Bearer ${token}`);
          }
        },
      ],
      beforeRetry: [
        ({ retryCount, error }) => {
          log.warn('Повтор запроса', { retryCount, error: error.message });
        },
      ],
    },
  });

  const request = async <T>(
    method: 'get' | 'post' | 'patch' | 'delete',
    path: string,
    init: { readonly json?: unknown; readonly searchParams?: SearchParams },
    retryOnUnauthorized = true,
  ): Promise<T> => {
    try {
      const response = await instance(path, {
        method,
        ...(init.json === undefined ? {} : { json: init.json }),
        ...(init.searchParams === undefined ? {} : { searchParams: { ...init.searchParams } }),
      });

      if (response.status === 204) {
        return undefined as T;
      }

      return (await response.json()) as T;
    } catch (error) {
      if (isHTTPError(error)) {
        if (error.response.status === 401 && retryOnUnauthorized) {
          const refreshed = await options.tokens.invalidate();

          if (refreshed !== null) {
            return request<T>(method, path, init, false);
          }
        }

        const { message, body } = describe(error.response.status, error.data);

        throw errorFromStatus(error.response.status, message, body);
      }

      if (isTimeoutError(error)) {
        throw new NetworkError('Превышено время ожидания сервера', null, { cause: error });
      }

      if (isNetworkError(error)) {
        throw new NetworkError('Нет соединения с сервером', null, { cause: error });
      }

      throw toAppError(error);
    }
  };

  return {
    get<T>(path: string, searchParams?: SearchParams): Promise<T> {
      return request<T>('get', path, searchParams === undefined ? {} : { searchParams });
    },
    post<T>(path: string, body?: unknown): Promise<T> {
      return request<T>('post', path, { json: body });
    },
    patch<T>(path: string, body?: unknown): Promise<T> {
      return request<T>('patch', path, { json: body });
    },
    async delete(path: string, body?: unknown): Promise<void> {
      await request<void>('delete', path, { json: body });
    },
  };
}

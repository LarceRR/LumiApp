import type { LogLevel, LogRecord, LogTransport } from '../Logger';

export type SentryBreadcrumbLevel = 'debug' | 'info' | 'warning' | 'error';

/**
 * Minimal port over the Sentry SDK so the shared layer never imports it directly
 * and unit tests can assert on plain objects.
 */
export type SentrySink = {
  addBreadcrumb(breadcrumb: {
    readonly category: string;
    readonly message: string;
    readonly level: SentryBreadcrumbLevel;
    readonly data: Readonly<Record<string, unknown>>;
  }): void;
  captureException(error: unknown, context: Readonly<Record<string, unknown>>): void;
};

const LEVELS: Readonly<Record<LogLevel, SentryBreadcrumbLevel>> = {
  debug: 'debug',
  info: 'info',
  warn: 'warning',
  error: 'error',
};

export function createSentryTransport(sink: SentrySink, minLevel: LogLevel = 'info'): LogTransport {
  return {
    name: 'sentry',
    minLevel,
    write(record: LogRecord): void {
      if (record.level === 'error' && record.error !== null) {
        sink.captureException(record.error, {
          scope: record.scope,
          message: record.message,
          ...record.meta,
        });
        return;
      }

      sink.addBreadcrumb({
        category: record.scope,
        message: record.message,
        level: LEVELS[record.level],
        data: record.meta,
      });
    },
  };
}

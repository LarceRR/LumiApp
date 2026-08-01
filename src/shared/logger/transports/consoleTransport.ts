/* eslint-disable no-console -- the console transport is the only sanctioned console consumer */
import type { LogLevel, LogRecord, LogTransport } from '../Logger';

const WRITERS: Readonly<Record<LogLevel, (...args: readonly unknown[]) => void>> = {
  debug: (...args) => console.log(...args),
  info: (...args) => console.info(...args),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
};

/** Development-only sink. Never registered in production builds. */
export function createConsoleTransport(minLevel: LogLevel = 'debug'): LogTransport {
  return {
    name: 'console',
    minLevel,
    write(record: LogRecord): void {
      const prefix = `[${record.scope}]`;
      const details: unknown[] = [];

      if (Object.keys(record.meta).length > 0) {
        details.push(record.meta);
      }

      if (record.error !== null) {
        details.push(record.error);
      }

      WRITERS[record.level](prefix, record.message, ...details);
    },
  };
}

import { toAppError } from '../errors';
import type { Logger, LogLevel, LogMeta, LogRecord, LogTransport } from './Logger';
import { isLevelEnabled } from './Logger';

type LoggerRoot = {
  readonly transports: readonly LogTransport[];
  readonly baseMeta: LogMeta;
};

function emit(root: LoggerRoot, record: LogRecord): void {
  for (const transport of root.transports) {
    if (!isLevelEnabled(record.level, transport.minLevel)) {
      continue;
    }

    try {
      transport.write(record);
    } catch {
      // A broken transport must never break the caller.
    }
  }
}

function build(root: LoggerRoot, scope: string): Logger {
  const log = (level: LogLevel, message: string, meta: LogMeta, error: unknown): void => {
    emit(root, {
      level,
      scope,
      message,
      meta: { ...root.baseMeta, ...meta },
      error: error === undefined ? null : toAppError(error),
      timestamp: Date.now(),
    });
  };

  return {
    debug: (message, meta = {}) => log('debug', message, meta, undefined),
    info: (message, meta = {}) => log('info', message, meta, undefined),
    warn: (message, meta = {}) => log('warn', message, meta, undefined),
    error: (message, error, meta = {}) => log('error', message, meta, error),
    child: (childScope) => build(root, `${scope}:${childScope}`),
  };
}

export function createLogger(options: {
  readonly scope: string;
  readonly transports: readonly LogTransport[];
  readonly baseMeta?: LogMeta;
}): Logger {
  return build({ transports: options.transports, baseMeta: options.baseMeta ?? {} }, options.scope);
}

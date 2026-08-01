import type { AppError } from '../errors';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogMeta = Readonly<Record<string, unknown>>;

export type LogRecord = {
  readonly level: LogLevel;
  readonly scope: string;
  readonly message: string;
  readonly meta: LogMeta;
  readonly error: AppError | null;
  readonly timestamp: number;
};

export type LogTransport = {
  readonly name: string;
  readonly minLevel: LogLevel;
  write(record: LogRecord): void;
};

export type Logger = {
  debug(message: string, meta?: LogMeta): void;
  info(message: string, meta?: LogMeta): void;
  warn(message: string, meta?: LogMeta): void;
  error(message: string, error?: unknown, meta?: LogMeta): void;
  child(scope: string): Logger;
};

const LEVEL_WEIGHT: Readonly<Record<LogLevel, number>> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export function isLevelEnabled(level: LogLevel, minLevel: LogLevel): boolean {
  return LEVEL_WEIGHT[level] >= LEVEL_WEIGHT[minLevel];
}

export type AppErrorKind =
  | 'validation'
  | 'network'
  | 'unauthorized'
  | 'forbidden'
  | 'conflict'
  | 'domain'
  | 'unknown';

export type AppErrorContext = Readonly<Record<string, unknown>>;

export type AppErrorOptions = {
  readonly context?: AppErrorContext;
  readonly cause?: unknown;
};

/**
 * Root of the application error hierarchy. Plain `Error` is never thrown by
 * domain, application or infrastructure code — everything is normalised here so
 * presentation can branch on `kind` instead of parsing messages.
 */
export abstract class AppError extends Error {
  abstract readonly kind: AppErrorKind;

  readonly context: AppErrorContext;

  /** Underlying failure, kept out of `cause` so we stay independent of the ES2022 lib. */
  readonly origin: unknown;

  constructor(message: string, options?: AppErrorOptions) {
    super(message);
    this.name = new.target.name;
    this.context = options?.context ?? {};
    this.origin = options?.cause;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /** Safe payload for logging / monitoring: never contains secrets by convention. */
  toJSON(): Readonly<Record<string, unknown>> {
    return {
      name: this.name,
      kind: this.kind,
      message: this.message,
      context: this.context,
    };
  }
}

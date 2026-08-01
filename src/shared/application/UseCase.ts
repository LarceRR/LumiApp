/** A single business operation. Never contains transport or React concerns. */
export type UseCase<TInput, TOutput> = (input: TInput) => Promise<TOutput>;

export type Query<TInput, TOutput> = UseCase<TInput, TOutput>;

export type Clock = {
  now(): number;
};

export const systemClock: Clock = {
  now: () => Date.now(),
};

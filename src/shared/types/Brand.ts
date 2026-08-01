declare const brand: unique symbol;

/** Nominal typing helper: `Brand<string, 'SpaceId'>` is not assignable from `string`. */
export type Brand<T, TBrand extends string> = T & { readonly [brand]: TBrand };

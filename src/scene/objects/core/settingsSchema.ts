/**
 * Declarative description of the tunable parameters of a scene object.
 *
 * The scene layer owns the schema, the UI layer only knows how to draw a
 * number / colour / switch row. Adding a new object means adding a schema —
 * never a new settings screen.
 */
export type SettingsValue = number | string | boolean;

export type NumberFieldSpec = {
  readonly kind: 'number';
  readonly path: string;
  readonly label: string;
  readonly min: number;
  readonly max: number;
  readonly step: number;
};

export type ColorFieldSpec = {
  readonly kind: 'color';
  readonly path: string;
  readonly label: string;
};

export type SwitchFieldSpec = {
  readonly kind: 'switch';
  readonly path: string;
  readonly label: string;
};

export type SettingsField = NumberFieldSpec | ColorFieldSpec | SwitchFieldSpec;

export type SettingsGroup = {
  readonly id: string;
  readonly title: string;
  readonly fields: readonly SettingsField[];
};

export type SettingsSchema = readonly SettingsGroup[];

export function numberField(
  path: string,
  label: string,
  min: number,
  max: number,
  step: number,
): NumberFieldSpec {
  return { kind: 'number', path, label, min, max, step };
}

export function colorField(path: string, label: string): ColorFieldSpec {
  return { kind: 'color', path, label };
}

export function switchField(path: string, label: string): SwitchFieldSpec {
  return { kind: 'switch', path, label };
}

export function settingsGroup(
  id: string,
  title: string,
  fields: readonly SettingsField[],
): SettingsGroup {
  return { id, title, fields };
}

/** Reads `a.b.c` out of a settings object. Returns undefined for unknown paths. */
export function readPath(source: object, path: string): SettingsValue | undefined {
  let current: unknown = source;

  for (const key of path.split('.')) {
    if (typeof current !== 'object' || current === null) {
      return undefined;
    }

    current = (current as Record<string, unknown>)[key];
  }

  if (typeof current === 'number' || typeof current === 'string' || typeof current === 'boolean') {
    return current;
  }

  return undefined;
}

/** Immutable write of `a.b.c`, so stores keep working with reference equality. */
export function writePath<T extends object>(source: T, path: string, value: SettingsValue): T {
  const segments = path.split('.');
  const head = segments[0];

  if (head === undefined) {
    return source;
  }

  const record = source as Record<string, unknown>;

  if (segments.length === 1) {
    return { ...record, [head]: value } as T;
  }

  const child = record[head];
  const nested = typeof child === 'object' && child !== null ? (child as object) : {};

  return { ...record, [head]: writePath(nested, segments.slice(1).join('.'), value) } as T;
}

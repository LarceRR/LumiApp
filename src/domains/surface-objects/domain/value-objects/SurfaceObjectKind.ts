/**
 * Open registry. `kind` decides visuals, semantics and sound through the scene
 * presentation registry — it never spawns a new domain entity.
 */
export type SurfaceObjectKind = string;

export const knownKinds = {
  fire: 'Fire',
  cloud: 'Cloud',
} as const;

export type KnownKind = (typeof knownKinds)[keyof typeof knownKinds];

/** Valence drives copy and statistics; it is data, not a subclass. */
export type KindValence = 'positive' | 'negative' | 'neutral';

export type KindPolicy = {
  readonly kind: SurfaceObjectKind;
  readonly valence: KindValence;
  /** Whether the kind is meaningful as self-reflection inside a personal space. */
  readonly allowSelfSubject: boolean;
  /** Search radius, in cells, used when placing a new object near existing ones. */
  readonly spawnRadius: number;
  /**
   * Minimum Chebyshev distance to any other object.
   * `2` = none of the 8 neighbouring cells may already hold an object.
   */
  readonly minSeparation: number;
};

const DEFAULT_POLICY: KindPolicy = {
  kind: 'Unknown',
  valence: 'neutral',
  allowSelfSubject: true,
  spawnRadius: 2,
  minSeparation: 1,
};

const POLICIES: Readonly<Record<string, KindPolicy>> = {
  [knownKinds.fire]: {
    kind: knownKinds.fire,
    valence: 'positive',
    allowSelfSubject: true,
    spawnRadius: 3,
    minSeparation: 2,
  },
  [knownKinds.cloud]: {
    kind: knownKinds.cloud,
    valence: 'negative',
    allowSelfSubject: true,
    spawnRadius: 2,
    minSeparation: 1,
  },
};

export function kindPolicy(kind: SurfaceObjectKind): KindPolicy {
  return POLICIES[kind] ?? { ...DEFAULT_POLICY, kind };
}

export function isKnownKind(kind: SurfaceObjectKind): kind is KnownKind {
  return kind in POLICIES;
}

export function allKindPolicies(): readonly KindPolicy[] {
  return Object.values(POLICIES);
}

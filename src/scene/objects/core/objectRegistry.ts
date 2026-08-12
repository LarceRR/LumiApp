import type { SurfaceObjectKind } from '@/domains/surface-objects/domain/value-objects/SurfaceObjectKind';

import type { SurfaceObjectDefinition } from './SurfaceObjectDefinition';

const REGISTRY = new Map<SurfaceObjectKind, SurfaceObjectDefinition>();

/** Called once per object module, at import time. */
export function registerSurfaceObject(definition: SurfaceObjectDefinition): void {
  REGISTRY.set(definition.kind, definition);
}

export function surfaceObjectDefinition(kind: SurfaceObjectKind): SurfaceObjectDefinition | null {
  return REGISTRY.get(kind) ?? null;
}

/** Registration order — the settings screen lists objects exactly like this. */
export function surfaceObjectDefinitions(): readonly SurfaceObjectDefinition[] {
  return [...REGISTRY.values()];
}

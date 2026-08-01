import { sceneColors } from '@/design-system/colors/colors';
import { type IconName, icons } from '@/design-system/icons/icons';
import {
  knownKinds,
  type SurfaceObjectKind,
} from '@/domains/surface-objects/domain/value-objects/SurfaceObjectKind';

/**
 * How a kind is drawn on the surface. Adding a kind means adding an entry here.
 */
export type KindRenderer =
  /** Icon on the surface grid. */
  | 'instancedModel'
  /** Floating label overlay. */
  | 'screenLabel';

export type KindPresentation = {
  readonly kind: SurfaceObjectKind;
  readonly renderer: KindRenderer;
  /** Product-facing wording; the domain never carries copy. */
  readonly title: string;
  readonly createLabel: string;
  readonly shortLabel: string;
  readonly icon: IconName;
  readonly tint: string;
  readonly emitsLight: boolean;
};

const FALLBACK: KindPresentation = {
  kind: 'Unknown',
  renderer: 'screenLabel',
  title: 'Объект',
  createLabel: 'Добавить объект',
  shortLabel: 'Объект',
  icon: icons.space,
  tint: sceneColors.cloudEdge,
  emitsLight: false,
};

const REGISTRY: Readonly<Record<string, KindPresentation>> = {
  [knownKinds.fire]: {
    kind: knownKinds.fire,
    renderer: 'instancedModel',
    title: 'Огонёк',
    createLabel: 'Зажечь огонёк',
    shortLabel: 'Огонёк',
    icon: icons.fire,
    tint: sceneColors.fireShell,
    emitsLight: true,
  },
  // The cloud model is not authored yet, so the kind is presented as a label.
  [knownKinds.cloud]: {
    kind: knownKinds.cloud,
    renderer: 'screenLabel',
    title: 'Облако',
    createLabel: 'Добавить тучку',
    shortLabel: 'Облако',
    icon: icons.cloud,
    tint: sceneColors.cloudEdge,
    emitsLight: false,
  },
};

export function kindPresentation(kind: SurfaceObjectKind): KindPresentation {
  return REGISTRY[kind] ?? { ...FALLBACK, kind };
}

export function presentableKinds(): readonly KindPresentation[] {
  return [REGISTRY[knownKinds.fire] ?? FALLBACK, REGISTRY[knownKinds.cloud] ?? FALLBACK];
}

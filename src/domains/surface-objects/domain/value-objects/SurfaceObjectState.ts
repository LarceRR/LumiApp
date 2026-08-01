export const surfaceObjectStates = ['Emerging', 'Active', 'Fading', 'Settled'] as const;

export type SurfaceObjectState = (typeof surfaceObjectStates)[number];

export type SurfaceObjectTransition = 'activate' | 'soften' | 'age';

/**
 * The single source of truth for the lifecycle, mirroring the backend domain
 * service. Any transition outside this table is rejected before persistence.
 */
const TRANSITIONS: Readonly<
  Record<
    SurfaceObjectTransition,
    {
      readonly from: SurfaceObjectState;
      readonly to: SurfaceObjectState;
    }
  >
> = {
  activate: { from: 'Emerging', to: 'Active' },
  soften: { from: 'Active', to: 'Fading' },
  age: { from: 'Fading', to: 'Settled' },
};

export function isSurfaceObjectState(value: string): value is SurfaceObjectState {
  return (surfaceObjectStates as readonly string[]).includes(value);
}

export function transitionTarget(transition: SurfaceObjectTransition): SurfaceObjectState {
  return TRANSITIONS[transition].to;
}

export function canApplyTransition(
  state: SurfaceObjectState,
  transition: SurfaceObjectTransition,
): boolean {
  return TRANSITIONS[transition].from === state;
}

export function availableTransitions(
  state: SurfaceObjectState,
): readonly SurfaceObjectTransition[] {
  return (Object.keys(TRANSITIONS) as readonly SurfaceObjectTransition[]).filter((transition) =>
    canApplyTransition(state, transition),
  );
}

/** Settled objects stay on the surface but no longer animate or emit light. */
export function isTerminalState(state: SurfaceObjectState): boolean {
  return state === 'Settled';
}

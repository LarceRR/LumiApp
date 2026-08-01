export const entitlementKeys = [
  'canUseAI',
  'canCreateMultipleSpaces',
  'canExportTimeline',
  'canUploadVoice',
] as const;

export type EntitlementKey = (typeof entitlementKeys)[number];

/**
 * Features are gated by entitlements, never by a plan name. Nothing in the app
 * asks "is the user premium?" — it asks whether a specific capability is granted.
 */
export type Entitlements = Readonly<Record<EntitlementKey, boolean>>;

export const freeEntitlements: Entitlements = {
  canUseAI: false,
  canCreateMultipleSpaces: false,
  canExportTimeline: false,
  canUploadVoice: false,
};

export function isGranted(entitlements: Entitlements, key: EntitlementKey): boolean {
  return entitlements[key];
}

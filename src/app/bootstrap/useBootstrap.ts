import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, AppState } from 'react-native';
import { useAuthStore } from '@/domains/auth/presentation/stores/authStore';
import { type PersistedSettings, persistedSettings, useSettingsStore } from '@/domains/settings/presentation/stores/settingsStore';
import { useFireSettingsStore } from '@/scene/objects/fire/fireSettingsStore';
import type { FireSettings } from '@/scene/objects/fire/fireSettings';
import { toAppError } from '@/shared/errors';
import { storageKeys } from '../config/constants';
import { loadNativeTabIconSources } from '../navigation/nativeTabIconSources';
import { usesNativeTabBar } from '../navigation/usesNativeTabBar';
import { useServices, useUseCases } from '../providers/ContainerProvider';

const BOOT_TIMEOUT_MS = 3_000;
async function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> { let timer: ReturnType<typeof setTimeout> | undefined; const timeout = new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error(`${label} timed out`)), BOOT_TIMEOUT_MS); }); try { return await Promise.race([promise, timeout]); } finally { if (timer !== undefined) clearTimeout(timer); } }

export function useBootstrap(): { readonly isReady: boolean } {
  const { restoreSession } = useUseCases();
  const { sessions, storage, offlineQueue, logger } = useServices();
  const [isReady, setIsReady] = useState(false);
  const started = useRef(false);
  useEffect(() => { if (started.current) return; started.current = true; const run = async (): Promise<void> => {
    try { const settings = await withTimeout(storage.read<PersistedSettings>(storageKeys.settings), 'settings restore'); if (settings !== null) useSettingsStore.getState().hydrate(settings); } catch (error) { logger.debug('Settings restore skipped', { error: String(error) }); }
    try { const fire = await withTimeout(storage.read<FireSettings>(storageKeys.fireSettings), 'fire settings restore'); useFireSettingsStore.getState().hydrate(fire); } catch (error) { logger.debug('Fire settings restore skipped', { error: String(error) }); }
    try { const reduceMotion = await withTimeout(AccessibilityInfo.isReduceMotionEnabled(), 'accessibility settings'); if (reduceMotion) useSettingsStore.getState().setReduceMotion(true); } catch (error) { logger.debug('Accessibility settings skipped', { error: String(error) }); }
    try { const session = await withTimeout(restoreSession(), 'session restore'); sessions.adopt(session); useAuthStore.getState().setSession(session); } catch (error) { logger.warn('Session restore skipped; opening anonymous app', { error: String(toAppError(error).message) }); useAuthStore.getState().setStatus('anonymous'); }
    if (usesNativeTabBar()) { try { await withTimeout(loadNativeTabIconSources(), 'native tab icons'); } catch (error) { logger.debug('Native tab icons skipped', { error: String(error) }); } }
    void offlineQueue.flush(); setIsReady(true);
  }; void run(); }, [restoreSession, sessions, storage, offlineQueue, logger]);
  useEffect(() => useSettingsStore.subscribe((state) => { void storage.write(storageKeys.settings, persistedSettings(state)); }), [storage]);
  useEffect(() => useFireSettingsStore.subscribe((state) => { void storage.write(storageKeys.fireSettings, state.settings); }), [storage]);
  useEffect(() => { const subscription = AppState.addEventListener('change', (status) => { if (status === 'active') void offlineQueue.flush(); }); return () => subscription.remove(); }, [offlineQueue]);
  return { isReady };
}

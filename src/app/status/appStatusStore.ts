import { create } from 'zustand';
export type AppStatusKind = 'processing' | 'success' | 'error' | 'offline';
export type AppStatusValue = { readonly kind: AppStatusKind; readonly message: string };
type State = {
  readonly status: AppStatusValue | null;
  setStatus: (status: AppStatusValue | null) => void;
};
export const useAppStatusStore = create<State>()((set) => ({
  status: null,
  setStatus: (status) => set({ status }),
}));

import { create } from 'zustand';

interface ChaosStore {
  isChaosMode: boolean;
  activateChaos: () => void;
  deactivateChaos: () => void;
  toggleChaos: () => void;
}

export const useChaosStore = create<ChaosStore>((set) => ({
  isChaosMode: false,
  activateChaos: () => set({ isChaosMode: true }),
  deactivateChaos: () => set({ isChaosMode: false }),
  toggleChaos: () => set((state) => ({ isChaosMode: !state.isChaosMode })),
}));

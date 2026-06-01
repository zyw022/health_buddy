// ─────────────────────────────────────────────
// apps/web/src/store/petStore.ts
//
// 全局宠物配置与健康状态 store（Zustand）。
// Phase 1 使用 mock 数据，Phase 2 替换为真实 API 调用。
// ─────────────────────────────────────────────

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PetConfig, HealthSnapshot } from '@health-buddy/shared-types';

export type PetAction = 'idle' | 'yawn' | 'stretch' | 'happy' | 'worried' | 'sleep';

interface PetState {
  config: PetConfig | null;
  currentAction: PetAction;
  latestHealth: HealthSnapshot | null;
  isOnboarded: boolean;

  setConfig: (config: PetConfig) => void;
  setAction: (action: PetAction) => void;
  setLatestHealth: (health: HealthSnapshot) => void;
  completeOnboarding: () => void;
  reset: () => void;
}

export const usePetStore = create<PetState>()(
  persist(
    (set) => ({
      config: null,
      currentAction: 'idle',
      latestHealth: null,
      isOnboarded: false,

      setConfig: (config) => set({ config }),
      setAction: (action) => set({ currentAction: action }),
      setLatestHealth: (health) => set({ latestHealth: health }),
      completeOnboarding: () => set({ isOnboarded: true }),
      reset: () =>
        set({ config: null, isOnboarded: false, latestHealth: null }),
    }),
    {
      name: 'health-buddy-pet',
      partialize: (state) => ({
        config: state.config,
        isOnboarded: state.isOnboarded,
      }),
    },
  ),
);

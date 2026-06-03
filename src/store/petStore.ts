import { create } from 'zustand'
import type { PetConfig, PetAction } from './types'

interface PetStore {
  config:        PetConfig | null
  currentAction: PetAction
  isOnboarded:   boolean
  bubbleText:    string | null

  setConfig(c: PetConfig): void
  setAction(a: PetAction): void
  completeOnboarding(): void
  setBubble(text: string | null): void
  reset(): void

  // Load config from assetstore/data/pet-config.json via IPC
  initFromFile(): Promise<void>
  // Save config to file via IPC
  saveToFile(c: PetConfig): Promise<void>
}

export const usePetStore = create<PetStore>((set, _get) => ({
  config:        null,
  currentAction: 'idle',
  isOnboarded:   false,
  bubbleText:    null,

  setConfig: (c) => set({ config: c }),
  setAction: (a) => set({ currentAction: a }),
  completeOnboarding: () => set({ isOnboarded: true }),
  setBubble: (text) => set({ bubbleText: text }),
  reset: () => set({ config: null, isOnboarded: false, currentAction: 'idle', bubbleText: null }),

  initFromFile: async () => {
    try {
      const api = (window as unknown as { electronAPI: ElectronAPI }).electronAPI
      const data = await api.readData('pet-config.json') as PetConfig | null
      if (data && data.name) {
        set({ config: data, isOnboarded: true })
      }
    } catch {
      // No config file yet — first run
    }
  },

  saveToFile: async (c) => {
    try {
      const api = (window as unknown as { electronAPI: ElectronAPI }).electronAPI
      await api.writeData('pet-config.json', c)
    } catch (err) {
      console.error('[petStore] saveToFile failed', err)
    }
  },
}))

// Type declaration for the preload-exposed API
export interface ElectronAPI {
  readData(filename: string): Promise<unknown>
  writeData(filename: string, data: unknown): Promise<boolean>
  windowMove(delta: { deltaX: number; deltaY: number }): void
  createPetWindow(): Promise<boolean>
  closeTreehouse(): void
  openTreehouse(route?: 'entry' | 'report' | 'change-pet'): Promise<boolean>
  notifyPetConfigUpdated(): Promise<boolean>
  showPetContextMenu(): void
  showTreehouseContextMenu(): void
  setIgnoreMouseEvents(ignore: boolean): void
  onPetAction(cb: (action: string) => void): void
  onSpeechBubble(cb: (payload: { text: string; duration?: number }) => void): void
  onWaterRecord(cb: (cups: number) => void): void
  onStepsRecord(cb: (steps: number) => void): void
  onPetConfigUpdated(cb: () => void): void
  removeAllListeners(channel: string): void
}

// Convenience accessor for the electron API (only available in Electron renderer)
export const getElectronAPI = (): ElectronAPI | null => {
  const w = window as unknown as { electronAPI?: ElectronAPI }
  return w.electronAPI ?? null
}

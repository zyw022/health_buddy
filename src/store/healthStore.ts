import { create } from 'zustand'
import type { RawHealthData, HealthState } from './types'
import { getElectronAPI } from './petStore'

interface HealthStore {
  raw:   RawHealthData | null
  state: HealthState   | null

  setRaw(d: RawHealthData): void
  setState(s: HealthState): void

  // Persist today's snapshot and archive yesterday
  persistToday(raw: RawHealthData, state: HealthState): Promise<void>
}

export const useHealthStore = create<HealthStore>((set) => ({
  raw:   null,
  state: null,

  setRaw:   (d) => set({ raw: d }),
  setState: (s) => set({ state: s }),

  persistToday: async (raw, state) => {
    const api = getElectronAPI()
    if (!api) return
    await api.writeData('health-today.json', { raw, state, date: new Date().toISOString() })

    // Daily archive at midnight: write health-history/YYYY-MM-DD.json
    const today = new Date().toISOString().split('T')[0]
    await api.writeData(`health-history/${today}.json`, { state, date: today })
  },
}))

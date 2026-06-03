import { create } from 'zustand'
import { getElectronAPI } from './petStore'

export interface Preference {
  id:        string
  text:      string
  createdAt: string   // ISO date string
}

interface PreferencesStore {
  items:    Preference[]
  loaded:   boolean
  load():   Promise<void>
  add(text: string): Promise<void>
  remove(id: string): Promise<void>
}

const FILE = 'preferences.json'

export const usePreferencesStore = create<PreferencesStore>((set, get) => ({
  items:  [],
  loaded: false,

  load: async () => {
    const api = getElectronAPI()
    if (!api) return
    const data = await api.readData(FILE) as Preference[] | null
    set({ items: Array.isArray(data) ? data : [], loaded: true })
  },

  add: async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    const newItem: Preference = {
      id:        crypto.randomUUID(),
      text:      trimmed,
      createdAt: new Date().toISOString(),
    }
    const items = [...get().items, newItem]
    set({ items })
    const api = getElectronAPI()
    await api?.writeData(FILE, items)
  },

  remove: async (id: string) => {
    const items = get().items.filter(p => p.id !== id)
    set({ items })
    const api = getElectronAPI()
    await api?.writeData(FILE, items)
  },
}))

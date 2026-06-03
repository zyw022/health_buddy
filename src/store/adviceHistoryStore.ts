import { create } from 'zustand'
import { getElectronAPI } from './petStore'

export interface AdviceRecord {
  id:        string
  text:      string
  action:    string   // PetAction that triggered the message
  createdAt: string   // ISO date string
}

interface AdviceHistoryStore {
  records:  AdviceRecord[]
  loaded:   boolean
  load():   Promise<void>
  /** Called by petBrain/overlay when a bubble message is emitted */
  push(text: string, action: string): Promise<void>
  clear():  Promise<void>
}

const FILE     = 'advice-history.json'
const MAX_KEEP = 200   // rolling window

export const useAdviceHistoryStore = create<AdviceHistoryStore>((set, get) => ({
  records: [],
  loaded:  false,

  load: async () => {
    const api = getElectronAPI()
    if (!api) return
    const data = await api.readData(FILE) as AdviceRecord[] | null
    set({ records: Array.isArray(data) ? data : [], loaded: true })
  },

  push: async (text: string, action: string) => {
    const record: AdviceRecord = {
      id:        crypto.randomUUID(),
      text,
      action,
      createdAt: new Date().toISOString(),
    }
    const records = [record, ...get().records].slice(0, MAX_KEEP)
    set({ records })
    const api = getElectronAPI()
    await api?.writeData(FILE, records)
  },

  clear: async () => {
    set({ records: [] })
    const api = getElectronAPI()
    await api?.writeData(FILE, [])
  },
}))

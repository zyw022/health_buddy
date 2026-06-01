import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from './ipc/types'

contextBridge.exposeInMainWorld('electronAPI', {
  // File-based data storage (assetstore/data/)
  readData:  (filename: string) =>
    ipcRenderer.invoke(IPC.READ_DATA, filename),

  writeData: (filename: string, data: unknown) =>
    ipcRenderer.invoke(IPC.WRITE_DATA, filename, data),

  // Window dragging for PetOverlay
  windowMove: (delta: { deltaX: number; deltaY: number }) =>
    ipcRenderer.send(IPC.WINDOW_MOVE, delta),

  // Notify main process that onboarding is done — create PetWindow
  createPetWindow: () =>
    ipcRenderer.invoke(IPC.CREATE_PET_WINDOW),

  // Close the treehouse window (called after PetWindow is up)
  closeTreehouse: () =>
    ipcRenderer.send(IPC.CLOSE_TREEHOUSE),

  // Open or focus treehouse window (entry splash, health report, or change pet)
  openTreehouse: (route: 'entry' | 'report' | 'change-pet' = 'report') =>
    ipcRenderer.invoke(IPC.OPEN_TREEHOUSE, route),

  // After change-pet save — tell main to push update to pet overlay
  notifyPetConfigUpdated: () =>
    ipcRenderer.invoke(IPC.NOTIFY_PET_CONFIG),

  showPetContextMenu: () =>
    ipcRenderer.send(IPC.SHOW_PET_MENU),

  // Toggle click-through for transparent pet window
  setIgnoreMouseEvents: (ignore: boolean) =>
    ipcRenderer.send(IPC.SET_IGNORE_MOUSE, ignore),

  // Listen for actions pushed from main process
  onPetAction: (cb: (action: string) => void) => {
    ipcRenderer.on(IPC.PET_ACTION_TRIGGER, (_event, action) => cb(action))
  },

  onSpeechBubble: (cb: (payload: { text: string; duration?: number }) => void) => {
    ipcRenderer.on(IPC.SHOW_SPEECH_BUBBLE, (_event, payload) => cb(payload))
  },

  onWaterRecord: (cb: (cups: number) => void) => {
    ipcRenderer.on(IPC.ADD_WATER_RECORD, (_event, cups) => cb(cups))
  },

  onStepsRecord: (cb: (steps: number) => void) => {
    ipcRenderer.on(IPC.ADD_STEPS, (_event, steps) => cb(steps))
  },

  onPetConfigUpdated: (cb: () => void) => {
    ipcRenderer.on(IPC.PET_CONFIG_UPDATED, () => cb())
  },

  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel)
  },
})

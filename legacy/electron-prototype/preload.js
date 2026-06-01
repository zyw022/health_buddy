/**
 * Preload Script — Secure IPC Bridge
 *
 * Exposes a limited, safe API to the renderer process
 * via contextBridge. All main-process operations go
 * through typed IPC channels.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // ============================================================
  // Window Management
  // ============================================================

  /** Open the treehouse dashboard window, hide the pet */
  openTreehouse: () => ipcRenderer.invoke('open-treehouse'),

  /** Close treehouse and return to desktop pet */
  closeTreehouse: () => ipcRenderer.invoke('close-treehouse'),

  /** Minimize treehouse (pet window reappears) */
  minimizeTreehouse: () => ipcRenderer.invoke('minimize-treehouse'),

  // ============================================================
  // Data
  // ============================================================

  /** Fetch current health data summary */
  getHealthData: () => ipcRenderer.invoke('get-health-data'),

  /** Listen for real-time health data updates */
  onHealthData: (callback) => {
    ipcRenderer.on('health-data-update', (_event, data) => callback(data));
  },

  // ============================================================
  // Pet State
  // ============================================================

  /** Send pet animation state to main process */
  updatePetState: (state) => ipcRenderer.send('update-pet-state', state),

  /** Listen for pet state changes (e.g. from treehouse actions) */
  onPetStateChanged: (callback) => {
    ipcRenderer.on('pet-state-changed', (_event, state) => callback(state));
  },

  // ============================================================
  // Window Dragging
  // ============================================================

  /** Move the pet window by delta (called during drag) */
  moveWindow: (deltaX, deltaY) => ipcRenderer.send('window-move', { deltaX, deltaY }),

  // ============================================================
  // Platform Info
  // ============================================================

  /** Get the current platform (win32, darwin, linux) */
  platform: process.platform,

  /** Check if running inside Electron */
  isElectron: true,
});

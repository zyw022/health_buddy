/**
 * Health Companion — Electron Main Process
 *
 * Window management:
 *  - PetWindow:    frameless, transparent, always-on-top desktop pet
 *  - TreehouseWindow: standard window for the treehouse health dashboard
 */

const { app, BrowserWindow, ipcMain, screen, globalShortcut } = require('electron');
const path = require('path');

// ============================================================
// State
// ============================================================
let petWindow = null;
let treehouseWindow = null;
const isDev = process.argv.includes('--dev');
const petOnly = process.argv.includes('--pet-only');

// ============================================================
// Window Creators
// ============================================================

/**
 * Create the desktop pet floating window.
 * Small, frameless, transparent, always-on-top.
 */
function createPetWindow() {
  const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize;
  const petW = 200;
  const petH = 240;

  petWindow = new BrowserWindow({
    width: petW,
    height: petH,
    x: screenW - petW - 30,
    y: screenH - petH - 60,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  petWindow.loadFile('pet.html');

  // Prevent closing — hide instead
  petWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      petWindow.hide();
    }
  });

  if (isDev) petWindow.webContents.openDevTools({ mode: 'detach' });
}

/**
 * Create the treehouse main window.
 * Standard window with frame, shows the health dashboard.
 */
function createTreehouseWindow() {
  if (treehouseWindow && !treehouseWindow.isDestroyed()) {
    treehouseWindow.focus();
    treehouseWindow.show();
    return;
  }

  treehouseWindow = new BrowserWindow({
    width: 1000,
    height: 720,
    minWidth: 400,
    minHeight: 600,
    center: true,
    show: false,
    title: '🏠 树屋 — Health Companion',
    backgroundColor: '#E3F2FD',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  treehouseWindow.loadFile('treehouse.html');

  treehouseWindow.once('ready-to-show', () => {
    treehouseWindow.show();
    // Hide pet while treehouse is open
    if (petWindow && !petWindow.isDestroyed()) {
      petWindow.hide();
    }
  });

  treehouseWindow.on('closed', () => {
    treehouseWindow = null;
    // Show pet again when treehouse closes
    if (petWindow && !petWindow.isDestroyed()) {
      petWindow.show();
    }
  });

  if (isDev) treehouseWindow.webContents.openDevTools({ mode: 'detach' });
}

// ============================================================
// IPC Handlers
// ============================================================

function registerIpcHandlers() {
  // Window dragging — move window by delta
  ipcMain.on('window-move', (event, { deltaX, deltaY }) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) {
      const [x, y] = win.getPosition();
      win.setPosition(x + deltaX, y + deltaY);
    }
  });

  // Open treehouse from pet window
  ipcMain.handle('open-treehouse', () => {
    createTreehouseWindow();
    return true;
  });

  // Close treehouse, return to pet
  ipcMain.handle('close-treehouse', () => {
    if (treehouseWindow && !treehouseWindow.isDestroyed()) {
      treehouseWindow.close();
    }
    if (petWindow && !petWindow.isDestroyed()) {
      petWindow.show();
    }
    return true;
  });

  // Get health data (reserved for backend integration)
  ipcMain.handle('get-health-data', async () => {
    // TODO: Integrate with backend API or local data service
    return getMockHealthData();
  });

  // Update pet animation state
  ipcMain.on('update-pet-state', (_event, state) => {
    if (petWindow && !petWindow.isDestroyed()) {
      petWindow.webContents.send('pet-state-changed', state);
    }
  });

  // Minimize treehouse (show pet, don't close)
  ipcMain.handle('minimize-treehouse', () => {
    if (treehouseWindow && !treehouseWindow.isDestroyed()) {
      treehouseWindow.minimize();
    }
    if (petWindow && !petWindow.isDestroyed()) {
      petWindow.show();
    }
    return true;
  });
}

// ============================================================
// Mock Data (reserved: replace with real API calls)
// ============================================================
function getMockHealthData() {
  return {
    steps:    { value: 8432, goal: 10000, percent: 84 },
    sleep:    { duration: '7h 30m', minutes: 450, quality: 4,
               stages: { deep: 180, light: 150, rem: 120 },
               bedTime: '23:30', wakeTime: '07:00' },
    screenTime: { total: '4h23m', totalMinutes: 263, change: 12,
                  breakdown: { work: '2h', social: '1h', entertainment: '38m' }},
    workStats:  { keystrokes: 12453, mouseClicks: 3267,
                  fileOps: 89, activeTime: '4h23m',
                  hourlyActivity: [12,20,32,48,24,28,18,36,44,40,22,16] },
    heartRate:  { value: 72, status: 'normal', restingHR: 62 },
    water:      { current: 6, goal: 8, mlPerCup: 250 },
    mood:       null,
  };
}

// ============================================================
// App Lifecycle
// ============================================================
app.isQuitting = false;

app.on('before-quit', () => {
  app.isQuitting = true;
});

app.whenReady().then(() => {
  registerIpcHandlers();

  // Always create pet window first
  createPetWindow();

  // Auto-open treehouse unless pet-only mode
  if (!petOnly) {
    createTreehouseWindow();
  }

  // Optional: global shortcut to toggle treehouse
  globalShortcut.register('CommandOrControl+Shift+T', () => {
    if (treehouseWindow && !treehouseWindow.isDestroyed() && treehouseWindow.isVisible()) {
      treehouseWindow.close();
    } else {
      createTreehouseWindow();
    }
  });

  console.log('🏠 Health Companion Treehouse started!');
  console.log('   - Pet window: bottom-right corner');
  console.log('   - Treehouse: Ctrl+Shift+T to toggle');
});

app.on('window-all-closed', () => {
  // On macOS, keep app running with pet in dock
  if (process.platform !== 'darwin') {
    // Don't quit — pet runs in background
    // app.quit();
  }
});

app.on('activate', () => {
  // macOS: re-show treehouse on dock click
  if (!treehouseWindow || treehouseWindow.isDestroyed()) {
    createTreehouseWindow();
  } else {
    treehouseWindow.show();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

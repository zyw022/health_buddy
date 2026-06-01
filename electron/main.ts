import {
  app,
  BrowserWindow,
  ipcMain,
  screen,
  Tray,
  Menu,
  nativeImage,
  dialog,
} from 'electron'
import path from 'node:path'
import fs from 'node:fs/promises'
import { IPC, type TreehouseRoute } from './ipc/types'

// Keep references to prevent GC
let treehouseWindow: BrowserWindow | null = null
let petWindow: BrowserWindow | null = null
let tray: Tray | null = null

const isDev = process.env['NODE_ENV'] === 'development'

// Data directory: project root assetstore/data/ in dev, resources/assetstore/data/ in prod
const DATA_DIR = isDev
  ? path.join(__dirname, '../../assetstore/data')
  : path.join(process.resourcesPath, 'assetstore/data')

// ── TreehouseWindow (startup + pet selection) ─────────────────────────────

function loadTreehouseWindow(win: BrowserWindow, route: TreehouseRoute = 'entry'): void {
  const query = route === 'report' ? { route: 'report' } : undefined

  if (isDev) {
    const base = process.env['ELECTRON_RENDERER_URL'] ?? 'http://localhost:5173'
    const url = query ? `${base}?route=report` : base
    void win.loadURL(url)
  } else {
    void win.loadFile(path.join(__dirname, '../renderer/index.html'), { query })
  }
}

function createTreehouseWindow(route: TreehouseRoute = 'entry'): void {
  if (treehouseWindow && !treehouseWindow.isDestroyed()) {
    loadTreehouseWindow(treehouseWindow, route)
    treehouseWindow.show()
    treehouseWindow.focus()
    return
  }

  treehouseWindow = new BrowserWindow({
    width: 960,
    height: 640,
    center: true,
    frame: false,
    resizable: false,
    backgroundColor: '#0d0d1a',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  loadTreehouseWindow(treehouseWindow, route)

  if (isDev) {
    treehouseWindow.webContents.openDevTools({ mode: 'detach' })
  }

  treehouseWindow.on('closed', () => {
    treehouseWindow = null
  })
}

// ── PetWindow (always-on-top floating pet) ───────────────────────────────

function createPetWindow(): void {
  if (petWindow && !petWindow.isDestroyed()) {
    petWindow.show()
    return
  }

  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize
  const W = 200
  const H = 240

  petWindow = new BrowserWindow({
    width: W,
    height: H,
    x: sw - W - 30,
    y: sh - H - 60,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    // Use query param to signal pet overlay mode
    void petWindow.loadURL(
      `${process.env['ELECTRON_RENDERER_URL'] ?? 'http://localhost:5173'}?mode=overlay`,
    )
  } else {
    void petWindow.loadFile(path.join(__dirname, '../renderer/index.html'), {
      query: { mode: 'overlay' },
    })
  }

  // Transparent areas pass clicks to the desktop; renderer re-enables on pet hover
  petWindow.webContents.once('did-finish-load', () => {
    petWindow?.setIgnoreMouseEvents(true, { forward: true })
  })

  petWindow.on('close', (e) => {
    // Prevent real close — hide instead (quit via tray)
    if (!(app as unknown as Record<string, boolean>)['isQuitting']) {
      e.preventDefault()
      petWindow?.hide()
    }
  })

  petWindow.on('closed', () => {
    petWindow = null
  })
}

// ── System Tray ──────────────────────────────────────────────────────────

function createTray(): void {
  const iconPath = isDev
    ? path.join(__dirname, '../../assetstore/icons/tray-icon.png')
    : path.join(process.resourcesPath, 'assetstore/icons/tray-icon.png')

  let icon: Electron.NativeImage
  try {
    icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })
  } catch {
    icon = nativeImage.createEmpty()
  }

  tray = new Tray(icon)
  tray.setToolTip('Health Buddy')

  const buildMenu = (): Electron.Menu =>
    Menu.buildFromTemplate([
      {
        label: petWindow?.isVisible() ? '隐藏宠物' : '显示宠物',
        click: () => {
          if (petWindow?.isVisible()) {
            petWindow.hide()
          } else {
            petWindow?.show()
          }
          tray?.setContextMenu(buildMenu())
        },
      },
      { type: 'separator' },
      {
        label: '记录喝水 +1杯',
        click: () => {
          petWindow?.webContents.send(IPC.ADD_WATER_RECORD, 1)
        },
      },
      {
        label: '记录步数...',
        click: () => {
          petWindow?.webContents.send(IPC.SHOW_SPEECH_BUBBLE, {
            text: '步数记录功能开发中，敬请期待～',
          })
        },
      },
      { type: 'separator' },
      {
        label: '查看健康报告（树屋）',
        click: () => {
          createTreehouseWindow('report')
        },
      },
      { type: 'separator' },
      {
        label: '退出',
        click: () => {
          ;(app as unknown as Record<string, boolean>)['isQuitting'] = true
          app.quit()
        },
      },
    ])

  tray.setContextMenu(buildMenu())
  tray.on('double-click', () => {
    if (petWindow) {
      petWindow.isVisible() ? petWindow.hide() : petWindow.show()
    } else {
      createPetWindow()
    }
  })
}

// ── IPC Handlers ─────────────────────────────────────────────────────────

function registerIpcHandlers(): void {
  // Generic file read (renderer → main → fs)
  ipcMain.handle(IPC.READ_DATA, async (_event, filename: string) => {
    try {
      const filePath = path.join(DATA_DIR, filename)
      const raw = await fs.readFile(filePath, 'utf-8')
      return JSON.parse(raw)
    } catch {
      return null
    }
  })

  // Generic file write (renderer → main → fs)
  ipcMain.handle(IPC.WRITE_DATA, async (_event, filename: string, data: unknown) => {
    try {
      const filePath = path.join(DATA_DIR, filename)
      await fs.mkdir(path.dirname(filePath), { recursive: true })
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
      return true
    } catch (err) {
      console.error('[write-data]', err)
      return false
    }
  })

  // Drag the pet window
  ipcMain.on(IPC.WINDOW_MOVE, (event, { deltaX, deltaY }: { deltaX: number; deltaY: number }) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win && !win.isDestroyed()) {
      const [x, y] = win.getPosition()
      win.setPosition(x + Math.round(deltaX), y + Math.round(deltaY))
    }
  })

  // Toggle mouse click-through on the pet overlay window
  ipcMain.on(IPC.SET_IGNORE_MOUSE, (event, ignore: boolean) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win && !win.isDestroyed()) {
      win.setIgnoreMouseEvents(ignore, { forward: true })
    }
  })

  // Onboarding complete: create the floating pet window
  ipcMain.handle(IPC.CREATE_PET_WINDOW, () => {
    createPetWindow()
    return true
  })

  // Close the treehouse window (called from renderer after PetWindow is ready)
  ipcMain.on(IPC.CLOSE_TREEHOUSE, () => {
    if (treehouseWindow && !treehouseWindow.isDestroyed()) {
      treehouseWindow.close()
    }
  })

  // Open treehouse window in entry or report mode (double-click pet / tray menu)
  ipcMain.handle(IPC.OPEN_TREEHOUSE, (_event, route: TreehouseRoute = 'report') => {
    createTreehouseWindow(route)
    return true
  })
}

// ── App lifecycle ─────────────────────────────────────────────────────────

;(app as unknown as Record<string, boolean>)['isQuitting'] = false

app.on('before-quit', () => {
  ;(app as unknown as Record<string, boolean>)['isQuitting'] = true
})

app.whenReady().then(() => {
  registerIpcHandlers()
  createTreehouseWindow()
  createTray()
})

app.on('window-all-closed', () => {
  // On Windows, keep the app running via tray even when all windows close
  if (process.platform !== 'darwin') {
    // Do NOT call app.quit() — tray keeps the app alive
  }
})

app.on('activate', () => {
  if (!treehouseWindow || treehouseWindow.isDestroyed()) {
    createTreehouseWindow()
  }
})

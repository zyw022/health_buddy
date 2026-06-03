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

// ── TreehouseWindow (floating image, like pet) ────────────────────────────

// Treehouse window sized to match 树屋.png aspect ratio (6395×5557 ≈ 1.15:1)
const TREEHOUSE_W = 600
const TREEHOUSE_H = 522

function loadTreehouseWindow(win: BrowserWindow, route: TreehouseRoute = 'entry'): void {
  const query: Record<string, string> = { mode: 'treehouse' }
  if (route !== 'entry') query.route = route

  if (isDev) {
    const base = process.env['ELECTRON_RENDERER_URL'] ?? 'http://localhost:5173'
    const qs = new URLSearchParams(query).toString()
    void win.loadURL(`${base}?${qs}`)
  } else {
    void win.loadFile(path.join(__dirname, '../renderer/index.html'), { query })
  }
}

function createTreehouseWindow(route: TreehouseRoute = 'entry'): void {
  if (treehouseWindow && !treehouseWindow.isDestroyed()) {
    loadTreehouseWindow(treehouseWindow, route)
    const [x, y] = treehouseWindow.getPosition()
    treehouseWindow.setBounds({ x, y, width: TREEHOUSE_W, height: TREEHOUSE_H })
    treehouseWindow.show()
    treehouseWindow.focus()
    return
  }

  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize

  treehouseWindow = new BrowserWindow({
    width: TREEHOUSE_W,
    height: TREEHOUSE_H,
    x: Math.round((sw - TREEHOUSE_W) / 2),
    y: Math.round((sh - TREEHOUSE_H) / 2),
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    thickFrame: false,
    useContentSize: true,
    minWidth: TREEHOUSE_W,
    maxWidth: TREEHOUSE_W,
    minHeight: TREEHOUSE_H,
    maxHeight: TREEHOUSE_H,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  loadTreehouseWindow(treehouseWindow, route)

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
      {
        label: '更换宠物',
        click: () => {
          createTreehouseWindow('change-pet')
        },
      },
      {
        label: '重置领养状态（重新选宠）',
        click: async () => {
          try {
            const filePath = path.join(DATA_DIR, 'pet-config.json')
            const raw  = await fs.readFile(filePath, 'utf-8')
            const data = JSON.parse(raw) as Record<string, unknown>
            data['adopted'] = false
            await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
            createTreehouseWindow('entry')
          } catch { /* ignore */ }
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

  // Drag the pet window (treehouse uses -webkit-app-region drag on title bar)
  ipcMain.on(IPC.WINDOW_MOVE, (event, { deltaX, deltaY }: { deltaX: number; deltaY: number }) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win || win.isDestroyed()) return

    const [x, y] = win.getPosition()
    const newX = x + Math.round(deltaX)
    const newY = y + Math.round(deltaY)

    if (win === treehouseWindow) {
      win.setBounds({ x: newX, y: newY, width: TREEHOUSE_W, height: TREEHOUSE_H })
    } else {
      win.setPosition(newX, newY)
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

  // Close / hide the treehouse window
  ipcMain.on(IPC.CLOSE_TREEHOUSE, () => {
    if (treehouseWindow && !treehouseWindow.isDestroyed()) {
      treehouseWindow.hide()
    }
  })

  // Open treehouse window in entry or report mode (double-click pet / tray menu)
  ipcMain.handle(IPC.OPEN_TREEHOUSE, (_event, route: TreehouseRoute = 'report') => {
    createTreehouseWindow(route)
    return true
  })

  // Pet config saved in change-pet flow — notify overlay to reload
  ipcMain.handle(IPC.NOTIFY_PET_CONFIG, () => {
    if (petWindow && !petWindow.isDestroyed()) {
      petWindow.webContents.send(IPC.PET_CONFIG_UPDATED)
      if (!petWindow.isVisible()) {
        petWindow.show()
      }
    } else {
      createPetWindow()
    }
    return true
  })

  // Right-click context menu on the floating treehouse
  ipcMain.on(IPC.SHOW_TREEHOUSE_MENU, () => {
    if (!treehouseWindow || treehouseWindow.isDestroyed()) return

    Menu.buildFromTemplate([
      {
        label: '查看健康报告',
        click: () => loadTreehouseWindow(treehouseWindow!, 'report'),
      },
      {
        label: '更换宠物',
        click: () => loadTreehouseWindow(treehouseWindow!, 'change-pet'),
      },
      { type: 'separator' },
      {
        label: '关闭树屋',
        click: () => treehouseWindow?.hide(),
      },
    ]).popup({ window: treehouseWindow })
  })

  // Right-click context menu on the floating pet
  ipcMain.on(IPC.SHOW_PET_MENU, () => {
    if (!petWindow || petWindow.isDestroyed()) return

    Menu.buildFromTemplate([
      {
        label: '查看健康报告',
        click: () => createTreehouseWindow('report'),
      },
      {
        label: '更换宠物',
        click: () => createTreehouseWindow('change-pet'),
      },
      { type: 'separator' },
      {
        label: '隐藏宠物',
        click: () => petWindow?.hide(),
      },
    ]).popup({ window: petWindow })
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

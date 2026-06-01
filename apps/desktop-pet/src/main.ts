// ─────────────────────────────────────────────
// apps/desktop-pet — Electron 主进程入口
//
// 窗口布局：
//   PetWindow     – 无边框、透明、始终置顶，右下角浮窗
//   TreehouseWindow – 标准仪表盘窗口
//
// 合并来源：legacy/electron-prototype/main.js（同学原型）
// TODO(phase-2): petWindow 加载 apps/web 构建产物；
//               treehouseWindow 加载 /dashboard 路由。
// ─────────────────────────────────────────────

import { app, BrowserWindow, ipcMain, screen, globalShortcut, Tray, Menu, nativeImage } from 'electron';
import path from 'node:path';
import { startKeyMouseCollector, stopKeyMouseCollector } from './collector/keyMouse';
import { startDecisionLoop, stopDecisionLoop } from './collector/decisionLoop';

// ── 全局窗口引用（防止 GC 回收） ─────────────
let petWindow: BrowserWindow | null = null;
let treehouseWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

const isDev = process.env['NODE_ENV'] === 'development';

// ── 宠物悬浮窗 ───────────────────────────────

function createPetWindow(): void {
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

  if (isDev) {
    // TODO(phase-2): 与 apps/web Vite 端口对齐（默认 5173）
    void petWindow.loadURL('http://localhost:5173');
    petWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    void petWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // 关闭时隐藏而非真正退出
  petWindow.on('close', (e) => {
    if (!(app as NodeJS.ProcessEnv & { isQuitting?: boolean }).isQuitting) {
      e.preventDefault();
      petWindow?.hide();
    }
  });

  petWindow.on('closed', () => {
    petWindow = null;
  });
}

// ── 树屋仪表盘窗口 ───────────────────────────

function createTreehouseWindow(): void {
  if (treehouseWindow != null && !treehouseWindow.isDestroyed()) {
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
    title: '🏠 树屋 — Health Buddy',
    backgroundColor: '#E3F2FD',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    // TODO(phase-2): 加载 apps/web Dashboard 路由
    void treehouseWindow.loadURL('http://localhost:5173/dashboard');
    treehouseWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    void treehouseWindow.loadFile(path.join(__dirname, '../treehouse/index.html'));
  }

  treehouseWindow.once('ready-to-show', () => {
    treehouseWindow?.show();
    // 树屋打开时隐藏宠物，避免重叠
    petWindow?.hide();
  });

  treehouseWindow.on('closed', () => {
    treehouseWindow = null;
    // 树屋关闭后重新显示宠物
    petWindow?.show();
  });
}

// ── 系统托盘 ─────────────────────────────────

function createTray(): void {
  // TODO(phase-2): 替换为真实 icon 资源
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    { label: '打开树屋', click: createTreehouseWindow },
    { type: 'separator' },
    { label: '退出', click: () => { (app as NodeJS.ProcessEnv & { isQuitting?: boolean }).isQuitting = true; app.quit(); } },
  ]);

  tray.setToolTip('Health Buddy');
  tray.setContextMenu(contextMenu);
  tray.on('double-click', createTreehouseWindow);
}

// ── IPC 通信 ─────────────────────────────────

function registerIpcHandlers(): void {
  // 宠物窗口拖拽：增量移动窗口位置
  ipcMain.on('window-move', (event, { deltaX, deltaY }: { deltaX: number; deltaY: number }) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) {
      const [x, y] = win.getPosition();
      win.setPosition(x + deltaX, y + deltaY);
    }
  });

  // 打开树屋（双击宠物 / 悬浮按钮）
  ipcMain.handle('open-treehouse', () => {
    createTreehouseWindow();
    return true;
  });

  // 关闭树屋并重新显示宠物
  ipcMain.handle('close-treehouse', () => {
    if (treehouseWindow && !treehouseWindow.isDestroyed()) {
      treehouseWindow.close();
    }
    petWindow?.show();
    return true;
  });

  // 最小化树屋（宠物重新显示）
  ipcMain.handle('minimize-treehouse', () => {
    if (treehouseWindow && !treehouseWindow.isDestroyed()) {
      treehouseWindow.minimize();
    }
    petWindow?.show();
    return true;
  });

  // 获取健康数据快照（Phase 2 接入真实 server API）
  ipcMain.handle('get-health-data', async () => {
    // TODO(phase-2): 从 apps/server REST /api/health-snapshot 取实时数据
    return getMockHealthData();
  });

  // 更新宠物动画状态（树屋 → 宠物）
  ipcMain.on('update-pet-state', (_event, state: unknown) => {
    if (petWindow && !petWindow.isDestroyed()) {
      petWindow.webContents.send('pet-state-changed', state);
    }
  });

  // 触发宠物动作（决策引擎 → 宠物）
  ipcMain.on('trigger-pet-action', (_event, triggerId: string) => {
    petWindow?.webContents.send('pet-action', triggerId);
  });
}

// ── Mock 健康数据（Phase 2 替换为真实 API） ──

function getMockHealthData() {
  return {
    steps:      { value: 8432, goal: 10000, percent: 84 },
    sleep:      { duration: '7h 30m', minutes: 450, quality: 4,
                  stages: { deep: 180, light: 150, rem: 120 },
                  bedTime: '23:30', wakeTime: '07:00' },
    screenTime: { total: '4h23m', totalMinutes: 263, change: 12,
                  breakdown: { work: '2h', social: '1h', entertainment: '38m' } },
    workStats:  { keystrokes: 12453, mouseClicks: 3267,
                  fileOps: 89, activeTime: '4h23m',
                  hourlyActivity: [12, 20, 32, 48, 24, 28, 18, 36, 44, 40, 22, 16] },
    heartRate:  { value: 72, status: 'normal', restingHR: 62 },
    water:      { current: 6, goal: 8, mlPerCup: 250 },
    mood:       null,
  };
}

// ── App 生命周期 ─────────────────────────────

(app as NodeJS.ProcessEnv & { isQuitting?: boolean }).isQuitting = false;

app.on('before-quit', () => {
  (app as NodeJS.ProcessEnv & { isQuitting?: boolean }).isQuitting = true;
  stopKeyMouseCollector();
  stopDecisionLoop();
});

app.whenReady().then(() => {
  registerIpcHandlers();
  createPetWindow();
  createTray();

  // 启动数据采集
  startKeyMouseCollector();
  startDecisionLoop();

  // Ctrl+Shift+T 全局快捷键切换树屋
  globalShortcut.register('CommandOrControl+Shift+T', () => {
    if (treehouseWindow && !treehouseWindow.isDestroyed() && treehouseWindow.isVisible()) {
      treehouseWindow.close();
    } else {
      createTreehouseWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // macOS：关闭窗口不退出，保持宠物后台运行
  if (process.platform !== 'darwin') {
    // 不调用 app.quit()，宠物在后台继续运行
  }
});

app.on('activate', () => {
  // macOS：点击 Dock 图标重新显示树屋
  if (!treehouseWindow || treehouseWindow.isDestroyed()) {
    createTreehouseWindow();
  } else {
    treehouseWindow.show();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// ─────────────────────────────────────────────
// apps/desktop-pet — Electron 主进程入口
//
// TODO(phase-2): 悬浮窗加载 apps/web 构建产物；树屋窗口打开 /dashboard。
// TODO(phase-2): overlay/ 透明窗拖拽；pet-ui/ 复用 web 的 PetSprite 组件。
// MVP 阶段无需启动本应用，优先 yarn dev:web。
// ─────────────────────────────────────────────

import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from 'electron';
import path from 'node:path';
import { startKeyMouseCollector, stopKeyMouseCollector } from './collector/keyMouse';
import { startDecisionLoop, stopDecisionLoop } from './collector/decisionLoop';

// ── 全局窗口引用（防止 GC 回收） ─────────────
let petWindow: BrowserWindow | null = null;
let treehouseWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

// ── 宠物悬浮窗 ───────────────────────────────

function createPetWindow(): void {
  petWindow = new BrowserWindow({
    width: 200,
    height: 200,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // 开发模式：加载 Vite 开发服务器
  if (process.env['NODE_ENV'] === 'development') {
    // TODO(phase-2): 与 apps/web 的 Vite 端口对齐（默认 5173）
    void petWindow.loadURL('http://localhost:5173');
    petWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    void petWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // 允许用户拖动宠物窗口
  petWindow.setIgnoreMouseEvents(false);

  petWindow.on('closed', () => {
    petWindow = null;
  });
}

// ── 树屋仪表盘窗口 ───────────────────────────

function createTreehouseWindow(): void {
  if (treehouseWindow != null) {
    treehouseWindow.focus();
    return;
  }

  treehouseWindow = new BrowserWindow({
    width: 1024,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    title: '树屋 — Health Buddy',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env['NODE_ENV'] === 'development') {
    // TODO(phase-2): 加载 apps/web Dashboard 路由
    void treehouseWindow.loadURL('http://localhost:5173/dashboard');
  } else {
    void treehouseWindow.loadFile(path.join(__dirname, '../treehouse/index.html'));
  }

  treehouseWindow.on('closed', () => {
    treehouseWindow = null;
  });
}

// ── 系统托盘 ─────────────────────────────────

function createTray(): void {
  const icon = nativeImage.createFromPath(path.join(__dirname, '../assets/tray-icon.png'));
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    { label: '打开树屋', click: createTreehouseWindow },
    { type: 'separator' },
    { label: '退出', click: () => app.quit() },
  ]);

  tray.setToolTip('Health Buddy');
  tray.setContextMenu(contextMenu);

  // 双击托盘图标打开树屋
  tray.on('double-click', createTreehouseWindow);
}

// ── IPC 通信 ─────────────────────────────────

function registerIpcHandlers(): void {
  // 渲染进程请求打开树屋（双击宠物触发）
  ipcMain.on('open-treehouse', () => {
    createTreehouseWindow();
  });

  // 渲染进程请求发送提醒（触发宠物动画）
  ipcMain.on('trigger-pet-action', (_event, triggerId: string) => {
    petWindow?.webContents.send('pet-action', triggerId);
  });
}

// ── App 生命周期 ─────────────────────────────

app.whenReady().then(() => {
  createPetWindow();
  createTray();
  registerIpcHandlers();

  // 启动数据采集
  startKeyMouseCollector();
  startDecisionLoop();
});

app.on('window-all-closed', () => {
  // macOS 习惯：关闭所有窗口不退出 app
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopKeyMouseCollector();
  stopDecisionLoop();
});

app.on('activate', () => {
  // macOS：点击 Dock 图标时重建宠物窗口
  if (petWindow == null) {
    createPetWindow();
  }
});

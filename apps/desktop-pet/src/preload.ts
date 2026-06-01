/**
 * apps/desktop-pet/src/preload.ts — Electron 预加载脚本
 *
 * 通过 contextBridge 安全暴露有限 IPC API 给渲染进程。
 * 与 legacy/electron-prototype/preload.js 接口完全对齐，
 * 使 apps/web 的 React 代码在 Electron 中运行时无需修改。
 *
 * TODO(phase-2): 按需扩展 onHealthData / onPetStateChanged 后
 *               在 apps/web 中通过 window.electronAPI 消费。
 */

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // ── 窗口管理 ───────────────────────────────

  /** 打开树屋仪表盘，同时隐藏宠物浮窗 */
  openTreehouse: () => ipcRenderer.invoke('open-treehouse'),

  /** 关闭树屋并返回桌宠 */
  closeTreehouse: () => ipcRenderer.invoke('close-treehouse'),

  /** 最小化树屋（宠物重新显示） */
  minimizeTreehouse: () => ipcRenderer.invoke('minimize-treehouse'),

  // ── 健康数据 ───────────────────────────────

  /** 获取当前健康数据快照 */
  getHealthData: () => ipcRenderer.invoke('get-health-data'),

  /** 监听实时健康数据推送（主进程 → 渲染进程） */
  onHealthData: (callback: (data: unknown) => void) => {
    ipcRenderer.on('health-data-update', (_event, data) => callback(data));
  },

  // ── 宠物状态 ───────────────────────────────

  /** 向主进程发送宠物动画状态 */
  updatePetState: (state: unknown) => ipcRenderer.send('update-pet-state', state),

  /** 监听宠物状态变更（主进程 → 渲染进程） */
  onPetStateChanged: (callback: (state: unknown) => void) => {
    ipcRenderer.on('pet-state-changed', (_event, state) => callback(state));
  },

  // ── 窗口拖拽 ───────────────────────────────

  /** 增量移动宠物浮窗（拖拽时每帧调用） */
  moveWindow: (deltaX: number, deltaY: number) =>
    ipcRenderer.send('window-move', { deltaX, deltaY }),

  // ── 平台信息 ───────────────────────────────

  /** 当前平台：win32 | darwin | linux */
  platform: process.platform,

  /** 是否运行在 Electron 环境中 */
  isElectron: true,
});

// ─────────────────────────────────────────────
// apps/desktop-pet/src/preload.ts — Electron 预加载脚本
//
// 通过 contextBridge 安全暴露有限 IPC API 给渲染进程（web UI）。
//
// TODO(phase-2): 暴露 openTreehouse()、sendPetAction()、onHealthUpdate() 给 web。
// TODO(phase-2): 确保 contextIsolation: true，不暴露 Node.js 完整 API。
// ─────────────────────────────────────────────

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('healthBuddy', {
  /** 通知主进程打开树屋仪表盘 */
  openTreehouse: () => ipcRenderer.send('open-treehouse'),

  /** 监听健康快照更新（主进程推送） */
  // TODO(phase-2): onHealthUpdate: (cb) => ipcRenderer.on('health-update', (_e, data) => cb(data)),

  /** 监听宠物动作触发（主进程推送） */
  // TODO(phase-2): onPetAction: (cb) => ipcRenderer.on('pet-action', (_e, triggerId) => cb(triggerId)),
});

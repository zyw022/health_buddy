// ─────────────────────────────────────────────
// apps/desktop-pet/src/ipc/types.ts — IPC 消息类型定义
//
// 主进程（main.ts）与渲染进程（pet-ui）之间的通信契约。
// TODO(phase-2): 按 Electron 安全规范，所有通道名都在此文件集中定义。
// ─────────────────────────────────────────────

/** IPC 通道名常量 */
export const IPC_CHANNELS = {
  /** 渲染进程 → 主进程：请求打开树屋窗口 */
  OPEN_TREEHOUSE: 'open-treehouse',
  /** 主进程 → 渲染进程：推送宠物动作触发 */
  PET_ACTION: 'pet-action',
  /** 主进程 → 渲染进程：推送最新健康快照 */
  HEALTH_UPDATE: 'health-update',
} as const;

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];

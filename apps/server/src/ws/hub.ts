// ─────────────────────────────────────────────
// apps/server/src/ws/hub.ts — WebSocket 推送中心
//
// 职责：向订阅的桌面端 / Web 客户端推送实时健康快照与宠物触发。
//
// TODO(phase-2): Hono + @hono/node-server WebSocket 升级（或 ws 库）。
// TODO(phase-2): 客户端注册：userId → socket 映射，断线自动清除。
// TODO(phase-2): broadcastHealthUpdate(userId, snapshot) 按 userId 推送。
// TODO(phase-2): broadcastPetAction(userId, trigger) 推送宠物行为触发。
// ─────────────────────────────────────────────

export interface WsHub {
  broadcastHealthUpdate(userId: string, payload: unknown): void;
  broadcastPetAction(userId: string, triggerId: string): void;
}

/** 占位实现，Phase 2 替换为真实 WebSocket hub。 */
export function createWsHub(): WsHub {
  return {
    broadcastHealthUpdate: () => { /* TODO(phase-2) */ },
    broadcastPetAction: () => { /* TODO(phase-2) */ },
  };
}

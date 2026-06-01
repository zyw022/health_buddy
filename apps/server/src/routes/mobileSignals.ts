// ─────────────────────────────────────────────
// apps/server/src/routes/mobileSignals.ts
//
// POST /api/mobile/signals — 接收手机信号批次
//
// TODO(phase-2): 实现 Zod 校验 MobileSignalBatch。
// TODO(phase-2): 写入 SQLite（via db/sqlite.ts）。
// TODO(phase-2): JWT 校验 userId，不信任 body 中的 userId。
// TODO(phase-2): 推送信号到 decision-engine WebSocket 通道。
// ─────────────────────────────────────────────

import { Hono } from 'hono';

export const mobileSignalsRouter = new Hono();

// TODO(phase-2): POST /signals
mobileSignalsRouter.post('/signals', async (c) => {
  // stub — 收到即返回 accepted
  return c.json({ status: 'stub', message: 'TODO(phase-2): not implemented' }, 501);
});

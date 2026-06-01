// ─────────────────────────────────────────────
// apps/server/src/routes/workSessions.ts
//
// 公共电脑 Web 工作会话管理
//
// POST   /api/work-sessions          — 开始会话
// POST   /api/work-sessions/heartbeat — 保活（30s 一次）
// POST   /api/work-sessions/end       — 结束会话
// GET    /api/work-sessions/:userId/active — 查询活跃会话
//
// TODO(phase-2): 实现会话创建、心跳更新、超时（30s 无心跳 → 过期）。
// TODO(phase-2): 写入 SQLite，与 decision-engine WebWorkSession 类型对齐。
// ─────────────────────────────────────────────

import { Hono } from 'hono';

export const workSessionsRouter = new Hono();

workSessionsRouter.post('/', async (c) => {
  return c.json({ status: 'stub', message: 'TODO(phase-2): not implemented' }, 501);
});

workSessionsRouter.post('/heartbeat', async (c) => {
  return c.json({ status: 'stub', message: 'TODO(phase-2): not implemented' }, 501);
});

workSessionsRouter.post('/end', async (c) => {
  return c.json({ status: 'stub', message: 'TODO(phase-2): not implemented' }, 501);
});

workSessionsRouter.get('/:userId/active', async (c) => {
  return c.json({ sessions: [], message: 'TODO(phase-2): not implemented' });
});

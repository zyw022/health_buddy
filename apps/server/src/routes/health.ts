// ─────────────────────────────────────────────
// apps/server/src/routes/health.ts
//
// 健康快照与日报查询
//
// GET /api/health/snapshot        — 最新 HealthSnapshot
// GET /api/health/daily/:date     — 每日报告（YYYY-MM-DD）
// GET /api/health/weekly          — 最近 7 天汇总（Phase 3 仪表盘图表）
//
// TODO(phase-2): 从 SQLite 读取 health-engine 写入的快照。
// TODO(phase-2): WebSocket 推送新快照到 apps/web Dashboard。
// TODO(phase-3): GET /weekly 供 Dashboard 7/30 天历史图表。
// ─────────────────────────────────────────────

import { Hono } from 'hono';

export const healthRouter = new Hono();

healthRouter.get('/snapshot', async (c) => {
  return c.json({ snapshot: null, message: 'TODO(phase-2): not implemented' });
});

healthRouter.get('/daily/:date', async (c) => {
  return c.json({ report: null, date: c.req.param('date'), message: 'TODO(phase-2): not implemented' });
});

healthRouter.get('/weekly', async (c) => {
  return c.json({ days: [], message: 'TODO(phase-3): not implemented' });
});

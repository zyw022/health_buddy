// ─────────────────────────────────────────────
// apps/server/src/index.ts — Hono 服务入口
//
// TODO(phase-2): 实现路由挂载、中间件（CORS、JWT 鉴权、日志）。
// TODO(phase-2): 连接 SQLite（db/sqlite.ts）并在 app.ready 初始化。
// TODO(phase-2): 启动 WebSocket 服务，推送 HealthSnapshot 到 desktop/web 客户端。
// ─────────────────────────────────────────────

import { Hono } from 'hono';
import { mobileSignalsRouter } from './routes/mobileSignals';
import { workSessionsRouter } from './routes/workSessions';
import { petConfigRouter } from './routes/petConfig';
import { healthRouter } from './routes/health';

const app = new Hono();

// TODO(phase-2): 添加 CORS、Bearer 鉴权、请求日志中间件

app.route('/api/mobile', mobileSignalsRouter);
app.route('/api/work-sessions', workSessionsRouter);
app.route('/api/pet', petConfigRouter);
app.route('/api/health', healthRouter);

app.get('/health', (c) => c.json({ status: 'ok', phase: 'stub' }));

export default app;

// ─────────────────────────────────────────────
// apps/server/src/routes/petConfig.ts
//
// 宠物配置 CRUD
//
// GET  /api/pet/config       — 读取宠物配置
// PUT  /api/pet/config       — 保存宠物配置
// POST /api/user/preferences — 更新用户偏好（兴趣、音乐风格）
//
// TODO(phase-2): 实现 SQLite 存取；JWT 绑定 userId。
// TODO(phase-3): 注入用户偏好到 llm-client PersonalityContext。
// ─────────────────────────────────────────────

import { Hono } from 'hono';

export const petConfigRouter = new Hono();

petConfigRouter.get('/config', async (c) => {
  return c.json({ config: null, message: 'TODO(phase-2): not implemented' });
});

petConfigRouter.put('/config', async (c) => {
  return c.json({ status: 'stub', message: 'TODO(phase-2): not implemented' }, 501);
});

petConfigRouter.post('/preferences', async (c) => {
  return c.json({ status: 'stub', message: 'TODO(phase-3): not implemented' }, 501);
});

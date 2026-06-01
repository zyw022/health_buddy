// ─────────────────────────────────────────────
// apps/server/src/scheduler/index.ts — 定时任务调度
//
// 职责：按固定间隔触发 decision-engine 和 health-engine 运算。
//
// TODO(phase-2): 每 5 分钟拉取最新信号窗口 → decision-engine → 写入 SQLite。
// TODO(phase-2): 每整点触发 health-engine 生成 HealthSnapshot。
// TODO(phase-2): 子任务：清除 30 天前的原始信号（保留 HealthSnapshot）。
// TODO(phase-3): 集成 llm-client 生成每日 AI 健康摘要（aiSummary）。
// ─────────────────────────────────────────────

export function startScheduler(): void {
  // TODO(phase-2): setInterval / node-cron 定时任务
}

export function stopScheduler(): void {
  // TODO(phase-2): clearInterval
}

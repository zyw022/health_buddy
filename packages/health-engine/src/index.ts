// ─────────────────────────────────────────────
// packages/health-engine — 健康分析层
//
// TODO(phase-2): 由 decisionLoop 每小时调用，输出 HealthSnapshot 供 API 存储。
// TODO(phase-3): fatigueScore / aiSummary 接入 packages/llm-client 多模态分析。
// TODO(phase-3): 可选接入 rPPG 心率（Python 子进程 → IPC）。
// MVP 阶段：apps/web/src/mock/healthData.ts 提供演示数据。
// ─────────────────────────────────────────────

import type {
  ActivityDecision,
  DailyHealthReport,
  HeartRateSample,
  HealthSnapshot,
  UserPreferences,
  WechatStepRecord,
} from '@health-buddy/shared-types';

// ── 每小时健康快照生成 ───────────────────────

export interface HourlyInput {
  userId: string;
  /** 本小时内所有经仲裁的活动决策 */
  decisions: ActivityDecision[];
  /** 本小时内的心率采样（可为空） */
  heartRateSamples: HeartRateSample[];
  /** 今日到当前时刻的微信步数 */
  stepsToday?: WechatStepRecord;
  userPrefs: UserPreferences;
  /** 上次喝水时间（Unix 毫秒），用于计算是否需要提醒 */
  lastDrinkMs?: number;
}

export function buildHourlySnapshot(input: HourlyInput): HealthSnapshot {
  const now = Date.now();

  // 计算本小时内久坐分钟：仅统计 working_local / uncertain 状态的窗口
  const sedentaryMs = input.decisions
    .filter((d) => d.state === 'working_local' || d.state === 'uncertain')
    .reduce((sum, d) => sum + (d.windowEndMs - d.windowStartMs), 0);
  const sedentaryMinutes = Math.round(sedentaryMs / 60_000);

  // 平均心率
  const heartRateBpm =
    input.heartRateSamples.length > 0
      ? Math.round(
          input.heartRateSamples.reduce((s, r) => s + r.bpm, 0) /
            input.heartRateSamples.length,
        )
      : undefined;

  // 疲劳分（规则占位，后续接 LLM 多模态分析）
  const fatigueScore = estimateFatigue(sedentaryMinutes, heartRateBpm);

  // 压力分（占位）
  const stressScore = estimateStress(heartRateBpm);

  // 喝水提醒：距上次喝水超过用户设定间隔
  const hydrInterval = input.userPrefs.healthGoals.hydrationIntervalMinutes;
  const hydrationReminderDue =
    input.lastDrinkMs != null
      ? now - input.lastDrinkMs >= hydrInterval * 60_000
      : true;

  return {
    ts: now,
    userId: input.userId,
    sedentaryMinutes,
    heartRateBpm,
    fatigueScore,
    stressScore,
    hydrationReminderDue,
  };
}

// ── 每日汇总报告 ─────────────────────────────

export interface DailyInput {
  userId: string;
  hourlySnapshots: HealthSnapshot[];
  stepsRecord?: WechatStepRecord;
  sleepDurationMinutes?: number;
  sleepQuality?: number;
}

export function buildDailyReport(input: DailyInput): DailyHealthReport {
  const date = new Date().toISOString().slice(0, 10);

  const totalSedentary = input.hourlySnapshots.reduce(
    (s, h) => s + h.sedentaryMinutes,
    0,
  );
  // 活跃分钟 = 60分钟/小时 - 久坐分钟（粗估）
  const totalActive = Math.max(0, input.hourlySnapshots.length * 60 - totalSedentary);

  const hrSamples = input.hourlySnapshots
    .map((h) => h.heartRateBpm)
    .filter((bpm): bpm is number => bpm != null);
  const avgHr =
    hrSamples.length > 0
      ? Math.round(hrSamples.reduce((a, b) => a + b, 0) / hrSamples.length)
      : undefined;

  const avgFatigue = Math.round(
    input.hourlySnapshots.reduce((s, h) => s + h.fatigueScore, 0) /
      Math.max(1, input.hourlySnapshots.length),
  );

  // AI 摘要占位：后续接入 GPT-4o 多模态分析
  const aiSummary = generateRuleSummary({
    totalActive,
    totalSedentary,
    avgFatigue,
    steps: input.stepsRecord?.steps ?? 0,
    sleepMinutes: input.sleepDurationMinutes,
  });

  return {
    date,
    userId: input.userId,
    totalActiveMinutes: totalActive,
    totalSedentaryMinutes: totalSedentary,
    totalSteps: input.stepsRecord?.steps ?? 0,
    avgHeartRateBpm: avgHr,
    avgFatigueScore: avgFatigue,
    sleepDurationMinutes: input.sleepDurationMinutes,
    sleepQuality: input.sleepQuality,
    aiSummary,
  };
}

// ── 内部估算函数（规则引擎占位）─────────────

function estimateFatigue(sedentaryMinutes: number, heartRateBpm?: number): number {
  // 久坐越久，疲劳分越高（基础分）
  let score = Math.min(60, (sedentaryMinutes / 50) * 30);

  // 心率异常（偏高）增加疲劳感
  if (heartRateBpm != null && heartRateBpm > 90) {
    score += Math.min(40, (heartRateBpm - 90) * 2);
  }

  return Math.min(100, Math.round(score));
}

function estimateStress(heartRateBpm?: number): number {
  if (heartRateBpm == null) return 30; // 默认中性分
  if (heartRateBpm > 100) return Math.min(100, 60 + (heartRateBpm - 100) * 2);
  if (heartRateBpm < 55) return 20; // 心率偏低，可能很放松
  return 30;
}

function generateRuleSummary(params: {
  totalActive: number;
  totalSedentary: number;
  avgFatigue: number;
  steps: number;
  sleepMinutes?: number;
}): string {
  const parts: string[] = [];

  if (params.totalSedentary > 300) {
    parts.push(`今天久坐时间较长（约 ${Math.round(params.totalSedentary / 60)} 小时），明天记得多站起来活动哦。`);
  } else {
    parts.push(`今天的活动节奏不错，久坐时间控制在合理范围内。`);
  }

  if (params.steps >= 8000) {
    parts.push(`步数达到 ${params.steps} 步，棒极了！`);
  } else if (params.steps > 0) {
    parts.push(`今日步数 ${params.steps} 步，明天可以再多走走。`);
  }

  if (params.avgFatigue >= 70) {
    parts.push(`整体疲劳指数偏高，建议早点休息。`);
  }

  if (params.sleepMinutes != null && params.sleepMinutes < 360) {
    parts.push(`昨夜睡眠不足 6 小时，今晚尽量早睡。`);
  }

  return parts.join(' ') || '今天数据正常，继续保持健康的生活节律。';
}

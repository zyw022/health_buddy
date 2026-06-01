// ─────────────────────────────────────────────
// apps/web/src/mock/healthData.ts
//
// Phase 1 MVP 使用 mock 数据；Phase 2 由 GET /api/health/snapshot 替代。
// TODO(phase-2): 改为 fetch HealthSnapshot，失败时 fallback 到 getMockHealthSnapshot。
// ─────────────────────────────────────────────

import type { HealthSnapshot, DailyHealthReport } from '@health-buddy/shared-types';

/**
 * 根据当前时间生成合理的模拟健康快照。
 *
 * 时段逻辑：
 *   06–08  清晨起床：疲劳低、状态好（→ happy）
 *   09–11  上午工作：久坐中、压力低（→ idle / stretch）
 *   11–14  午前压力高峰：压力大（→ worried）
 *   14–17  下午连续工作：久坐严重（→ stretch）
 *   18–20  傍晚收尾：疲劳累积（→ yawn）
 *   20–23  夜间：高疲劳、需要休息（→ yawn）
 *   23–06  深夜/凌晨（→ sleep）
 */
export function getMockHealthSnapshot(): HealthSnapshot {
  const hour = new Date().getHours();

  // 默认值
  let sedentaryMinutes = 20;
  let fatigueScore = 25;
  let stressScore = 20;
  let hydrationReminderDue = false;

  if (hour >= 6 && hour < 9) {
    // 清晨：状态最好
    sedentaryMinutes = 10;
    fatigueScore = 15 + Math.round(Math.random() * 10);
    stressScore = 10 + Math.round(Math.random() * 10);
    hydrationReminderDue = false;
  } else if (hour >= 9 && hour < 11) {
    // 上午工作：适度久坐
    sedentaryMinutes = 45 + Math.round(Math.random() * 20);
    fatigueScore = 25 + Math.round(Math.random() * 15);
    stressScore = 25 + Math.round(Math.random() * 15);
    hydrationReminderDue = hour % 2 === 0;
  } else if (hour >= 11 && hour < 14) {
    // 午前压力高峰
    sedentaryMinutes = 50 + Math.round(Math.random() * 20);
    fatigueScore = 35 + Math.round(Math.random() * 20);
    stressScore = 60 + Math.round(Math.random() * 15);
    hydrationReminderDue = true;
  } else if (hour >= 14 && hour < 18) {
    // 下午连续久坐
    sedentaryMinutes = 65 + Math.round(Math.random() * 25);
    fatigueScore = 45 + Math.round(Math.random() * 20);
    stressScore = 40 + Math.round(Math.random() * 20);
    hydrationReminderDue = hour % 2 === 0;
  } else if (hour >= 18 && hour < 20) {
    // 傍晚收尾
    sedentaryMinutes = 30 + Math.round(Math.random() * 20);
    fatigueScore = 55 + Math.round(Math.random() * 20);
    stressScore = 30 + Math.round(Math.random() * 15);
    hydrationReminderDue = false;
  } else if (hour >= 20 && hour < 23) {
    // 夜间疲劳
    sedentaryMinutes = 20 + Math.round(Math.random() * 15);
    fatigueScore = 70 + Math.round(Math.random() * 20);
    stressScore = 25 + Math.round(Math.random() * 15);
    hydrationReminderDue = false;
  }

  return {
    ts: Date.now(),
    userId: 'mock-user',
    sedentaryMinutes,
    fatigueScore,
    stressScore,
    hydrationReminderDue,
    // 用条件展开避免 exactOptionalPropertyTypes 报错
    ...(hour < 9 ? { sleepQuality: 68 + Math.round(Math.random() * 20) } : {}),
    notes: '来自模拟数据，Phase 2 接入真实采集后会更准确。',
  };
}

export function getMockDailyReport(): DailyHealthReport {
  return {
    date: new Date().toISOString().slice(0, 10),
    userId: 'mock-user',
    totalActiveMinutes: 180,
    totalSedentaryMinutes: 300,
    totalSteps: 4200,
    avgFatigueScore: 52,
    sleepDurationMinutes: 420,
    sleepQuality: 68,
    aiSummary:
      '今天久坐时间偏长，步数还不错。建议明天多站起来走动，保持好的状态！',
  };
}

export interface WeeklyHealthPoint {
  date: string;
  steps: number;
  sedentaryMinutes: number;
  fatigueScore: number;
  sleepMinutes: number;
}

export function getMockWeeklyData(): WeeklyHealthPoint[] {
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      date: d.toISOString().slice(0, 10),
      steps: 2000 + Math.round(Math.random() * 6000),
      sedentaryMinutes: 180 + Math.round(Math.random() * 200),
      fatigueScore: 20 + Math.round(Math.random() * 60),
      sleepMinutes: 360 + Math.round(Math.random() * 120),
    };
  });
}

// ─────────────────────────────────────────────
// apps/web/src/mock/healthData.ts
//
// Phase 1 MVP 使用 mock 数据；Phase 2 由 GET /api/health/snapshot 替代。
// TODO(phase-2): 改为 fetch HealthSnapshot，失败时 fallback 到 getMockHealthSnapshot。
// ─────────────────────────────────────────────

import type { HealthSnapshot, DailyHealthReport } from '@health-buddy/shared-types';

export function getMockHealthSnapshot(): HealthSnapshot {
  const hour = new Date().getHours();

  // 动态 mock：根据当前时间给出合理的模拟状态
  const sedentaryMinutes = hour >= 9 && hour < 18 ? 55 : 20;
  const fatigueScore = hour >= 20 ? 72 : hour >= 14 ? 48 : 30;
  const stressScore = hour >= 11 && hour < 15 ? 55 : 30;
  const hydrationReminderDue = hour % 2 === 0;

  return {
    ts: Date.now(),
    userId: 'mock-user',
    sedentaryMinutes,
    fatigueScore,
    stressScore,
    hydrationReminderDue,
    sleepQuality: hour < 8 ? 75 : undefined,
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
    avgHeartRateBpm: undefined,
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

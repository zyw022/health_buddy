// ─────────────────────────────────────────────
// HealthCards — 健康数据卡片组合
// ─────────────────────────────────────────────

import React from 'react';
import { motion } from 'framer-motion';
import type { HealthSnapshot } from '@health-buddy/shared-types';

interface CardProps {
  icon: string;
  label: string;
  value: React.ReactNode;
  sub?: string;
  color: string;
  delay?: number;
}

const HealthCard: React.FC<CardProps> = ({ icon, label, value, sub, color, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="
      flex items-center gap-3
      bg-white/10
      backdrop-blur-sm
      rounded-2xl
      px-4 py-3
      border border-white/15
    "
  >
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
      style={{ background: color }}
    >
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-white/60 text-xs">{label}</div>
      <div className="text-white font-medium text-base truncate">{value}</div>
      {sub && <div className="text-white/40 text-xs truncate">{sub}</div>}
    </div>
  </motion.div>
);

interface ProgressBarProps {
  value: number; // 0–100
  color: string;
  label: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, color, label }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs text-white/60">
      <span>{label}</span>
      <span>{value}%</span>
    </div>
    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </div>
  </div>
);

interface Props {
  health: HealthSnapshot;
  className?: string;
}

function fatigueLabel(score: number): string {
  if (score >= 75) return '很疲惫，快休息下';
  if (score >= 50) return '有些疲惫';
  if (score >= 30) return '状态尚可';
  return '精力充沛';
}

function sedentaryLabel(minutes: number): string {
  if (minutes >= 60) return `连续久坐 ${minutes} 分钟 ⚠️`;
  if (minutes >= 30) return `已坐 ${minutes} 分钟`;
  return `坐了 ${minutes} 分钟，还好`;
}

export const HealthCards: React.FC<Props> = ({ health, className = '' }) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {/* 久坐 — var(--color-vitality-orange) */}
      <HealthCard
        icon="🪑"
        label="久坐时长"
        value={sedentaryLabel(health.sedentaryMinutes)}
        color="rgba(255,152,0,0.25)"
        delay={0.1}
      />

      {/* 疲劳 — var(--color-sleep-purple) */}
      <HealthCard
        icon="😪"
        label="疲劳指数"
        value={fatigueLabel(health.fatigueScore)}
        sub={`评分 ${health.fatigueScore}/100`}
        color="rgba(124,77,255,0.25)"
        delay={0.2}
      />

      {/* 心率（可选） — var(--color-heart-red) */}
      {health.heartRateBpm && (
        <HealthCard
          icon="❤️"
          label="估算心率"
          value={`${health.heartRateBpm} bpm`}
          sub="来自摄像头 rPPG"
          color="rgba(244,67,54,0.25)"
          delay={0.3}
        />
      )}

      {/* 压力 — var(--color-sky-blue) */}
      {health.stressScore > 0 && (
        <HealthCard
          icon="🧠"
          label="压力水平"
          value={health.stressScore >= 60 ? '压力偏大' : '还好'}
          color="rgba(33,150,243,0.25)"
          delay={0.35}
        />
      )}

      {/* 补水提醒 — var(--color-sky-blue) */}
      {health.hydrationReminderDue && (
        <HealthCard
          icon="💧"
          label="喝水提醒"
          value="该补充水分了"
          color="rgba(3,169,244,0.25)"
          delay={0.4}
        />
      )}

      {/* 进度条 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="
          bg-white/10 backdrop-blur-sm
          rounded-2xl px-4 py-3
          border border-white/15
          space-y-2.5
        "
      >
        <div className="text-white/60 text-xs mb-1">今日指标</div>
        <ProgressBar
          value={Math.min(100, Math.round((health.sedentaryMinutes / 60) * 50))}
          color="var(--color-vitality-orange)"
          label="久坐压力"
        />
        <ProgressBar
          value={health.fatigueScore}
          color="var(--color-sleep-purple)"
          label="疲劳度"
        />
        {health.stressScore > 0 && (
          <ProgressBar
            value={health.stressScore}
            color="var(--color-sky-blue)"
            label="压力值"
          />
        )}
      </motion.div>
    </div>
  );
};

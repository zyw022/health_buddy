// ─────────────────────────────────────────────
// apps/desktop-pet/src/collector/decisionLoop.ts
//
// TODO(phase-2): 接入 server WebSocket 手机信号、Web 工作会话、微信步数。
// TODO(phase-2): 输出接 health-engine → pet-engine → IPC 推送 pet-ui。
// MVP 阶段不运行；决策逻辑单测见 packages/decision-engine。
// ─────────────────────────────────────────────

import { arbitrate, currentWindow } from '@health-buddy/decision-engine';
import type { SignalWindow } from '@health-buddy/decision-engine';
import { isKeyMouseCollectorOnline, recentSnapshots } from './keyMouse';

const LOOP_INTERVAL_MS = 5 * 60 * 1000; // 5 分钟

let loopTimer: ReturnType<typeof setInterval> | null = null;

export function startDecisionLoop(): void {
  loopTimer = setInterval(runDecision, LOOP_INTERVAL_MS);
}

export function stopDecisionLoop(): void {
  if (loopTimer != null) {
    clearInterval(loopTimer);
    loopTimer = null;
  }
}

async function runDecision(): Promise<void> {
  const userId = getUserId();
  const base = currentWindow(userId);

  // 聚合信号
  const window: SignalWindow = {
    ...base,
    desktopCollectorOnline: isKeyMouseCollectorOnline(),
    desktopUnlocked: true,              // TODO(phase-2): 接入 powerMonitor 判断锁屏状态
    keyMouseSnapshots: recentSnapshots(5),
    phoneScreenEvents: [],             // TODO: 从 server 同步手机端事件
    phoneMotionEvents: [],             // TODO: 从 mobile collector 同步运动状态
    proximitySignals: [],              // TODO: 同 WiFi / 蓝牙近距信号
    webWorkSessions: [],               // TODO: 公共电脑网页版工作会话
    wechatMultiDeviceActive: false,    // TODO: 检测微信多端在线状态
  };

  const { decision, signals, coverage, candidates } = arbitrate(window);

  console.log('[decision]', {
    state: decision.state,
    confidence: decision.confidence,
    confidenceScore: decision.confidenceScore,
    coverage,
    candidates,
    signals,
  });

  // TODO: 将 decision 写入本地 SQLite，并通过 WebSocket 上报至 server
  // TODO: 将 decision 传入 health-engine.buildHourlySnapshot()
  // TODO: 将 health-engine 输出传入 pet-engine.evaluateTriggers()
  // TODO: 触发结果推送给渲染进程（petWindow.webContents.send('pet-trigger', ...)）
}

function getUserId(): string {
  return process.env['USER_ID'] ?? 'dev-user';
}

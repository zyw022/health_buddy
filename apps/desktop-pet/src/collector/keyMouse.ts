// ─────────────────────────────────────────────
// apps/desktop-pet/src/collector/keyMouse.ts
//
// 职责：在主进程中被动采集键盘击键次数与鼠标移动距离，
//       每分钟汇总一次，生成 KeyMouseSnapshot 并写入本地 SQLite。
//
// 隐私说明：
//   - 仅统计次数与距离，不记录任何具体按键内容
//   - 数据存储在本地，不自动上传（上传由用户授权后触发）
// ─────────────────────────────────────────────

import type { KeyMouseSnapshot } from '@health-buddy/shared-types';

// TODO(phase-2): 替换为 uiohook-napi（Windows/macOS 全局键鼠钩子）。
// 此处为接口占位，团队成员实现时补充 import。

let keystrokes = 0;
let mouseClicks = 0;
let mouseDistance = 0;
let lastMouseX: number | null = null;
let lastMouseY: number | null = null;

let collectTimer: ReturnType<typeof setInterval> | null = null;
let snapshots: KeyMouseSnapshot[] = [];
let collectorOnline = false;

/** 启动键鼠采集器（主进程调用） */
export function startKeyMouseCollector(): void {
  collectorOnline = true;

  // ── 钩子注册占位 ──────────────────────────
  // 实现时在此处注册全局键盘/鼠标监听：
  //
  //   import { uIOhook, UiohookKey } from 'uiohook-napi';
  //   uIOhook.on('keydown', () => { keystrokes++; });
  //   uIOhook.on('mousedown', () => { mouseClicks++; });
  //   uIOhook.on('mousemove', (e) => { /* 累加距离 */ });
  //   uIOhook.start();
  //
  // ─────────────────────────────────────────

  // 每分钟汇总一次快照
  collectTimer = setInterval(() => {
    const snap = flushSnapshot();
    snapshots.push(snap);
    snapshots = snapshots.slice(-120); // 只保留最近 2 小时窗口，完整历史后续写入 SQLite。
    // TODO: 写入 SQLite（接入 better-sqlite3）
    console.log('[collector] snapshot', snap);
  }, 60_000);
}

/** 停止采集器，清理资源 */
export function stopKeyMouseCollector(): void {
  collectorOnline = false;
  if (collectTimer != null) {
    clearInterval(collectTimer);
    collectTimer = null;
  }
  // TODO: uIOhook.stop();
}

/** 获取近 N 条快照（供 decision-engine 消费） */
export function recentSnapshots(n = 5): KeyMouseSnapshot[] {
  return snapshots.slice(-n);
}

export function isKeyMouseCollectorOnline(): boolean {
  return collectorOnline;
}

// ── 内部工具 ─────────────────────────────────

function flushSnapshot(): KeyMouseSnapshot {
  const observedIdle = keystrokes === 0 && mouseClicks === 0 && mouseDistance === 0;
  const activityIntensity = Math.min(
    100,
    Math.round((keystrokes + mouseClicks) * 4 + mouseDistance / 30),
  );
  const snap: KeyMouseSnapshot = {
    ts: Date.now(),
    deviceId: getDeviceId(),
    keystrokes,
    mouseDistance: Math.round(mouseDistance),
    mouseClicks,
    observedIdle,
    activityIntensity,
  };

  // 重置计数器
  keystrokes = 0;
  mouseClicks = 0;
  mouseDistance = 0;
  lastMouseX = null;
  lastMouseY = null;

  return snap;
}

function accumulateMouseMove(x: number, y: number): void {
  if (lastMouseX != null && lastMouseY != null) {
    const dx = x - lastMouseX;
    const dy = y - lastMouseY;
    mouseDistance += Math.sqrt(dx * dx + dy * dy);
  }
  lastMouseX = x;
  lastMouseY = y;
}

// TODO: 接入真实 deviceId（首次运行时生成 UUID 并持久化）
function getDeviceId(): string {
  return process.env['DEVICE_ID'] ?? 'dev-placeholder';
}

// 导出供钩子回调使用（团队成员接入 uiohook 后调用）
export const hooks = {
  onKeydown: () => { keystrokes++; },
  onMouseClick: () => { mouseClicks++; },
  onMouseMove: accumulateMouseMove,
};

// ─────────────────────────────────────────────
// packages/decision-engine — 多设备决策仲裁层
//
// 核心打分逻辑已实现。MVP 阶段由 apps/web/mock 代替 UI 侧推断。
// TODO(phase-2): apps/desktop-pet/decisionLoop 传入真实 SignalWindow（键鼠、手机、Web 会话）。
// ─────────────────────────────────────────────

import type {
  ActivityDecision,
  ActivityEvidence,
  ActivityState,
  ActivityStateScore,
  ConfidenceLevel,
  KeyMouseSnapshot,
  ObservationCoverage,
  PhoneScreenEvent,
  PhoneMotionEvent,
  ProximitySignal,
  SignalQuality,
  WebWorkSession,
  WechatStepRecord,
} from '@health-buddy/shared-types';

// ── 仲裁时间窗口（分钟） ─────────────────────
const WINDOW_MINUTES = 5;

export interface SignalWindow {
  /** 窗口起点 Unix 毫秒 */
  startMs: number;
  /** 窗口终点 Unix 毫秒 */
  endMs: number;
  userId: string;
  /** 桌面采集器是否在线。false/undefined 表示本机信号缺失，不等于用户无活动。 */
  desktopCollectorOnline?: boolean;
  /** 当前电脑是否处于解锁/可交互状态。 */
  desktopUnlocked?: boolean;
  /** 本窗口内的键鼠快照（可能为空） */
  keyMouseSnapshots: KeyMouseSnapshot[];
  /** 本窗口内的手机亮屏事件 */
  phoneScreenEvents: PhoneScreenEvent[];
  /** 本窗口内的手机运动状态 */
  phoneMotionEvents?: PhoneMotionEvent[];
  /** 手机与已知电脑的近距信号 */
  proximitySignals?: ProximitySignal[];
  /** 公共电脑/网页工作会话心跳 */
  webWorkSessions?: WebWorkSession[];
  /** 今日微信步数（可能为 undefined，表示尚未获取） */
  wechatStepsToday?: WechatStepRecord;
  /** 上一个窗口记录的微信步数，用于判断步数增量。 */
  previousWechatStepsToday?: WechatStepRecord;
  /** 微信是否检测到同账号多端在线（desktop + mobile 同时活跃） */
  wechatMultiDeviceActive: boolean;
  /** 当前本地时间小时（0–23），用于判断是否深夜 */
  localHour: number;
}

export interface DecisionResult {
  decision: ActivityDecision;
  /** 调试用：各信号值汇总 */
  signals: SignalSummary;
  coverage: ObservationCoverage;
  candidates: ActivityStateScore[];
}

interface SignalSummary {
  hasLocalActivity: boolean;
  hasPhoneActivity: boolean;
  hasStepIncrease: boolean;
  hasWalkingMotion: boolean;
  hasVehicleMotion: boolean;
  nearKnownDesktop: boolean;
  hasWebWorkSession: boolean;
  isMultiDevice: boolean;
  isNightTime: boolean;
  isWorkHour: boolean;
  desktopCollectorOnline: boolean;
  desktopUnlocked: boolean;
  localKeystrokesTotal: number;
  localMouseDistance: number;
  localActivityIntensity: number;
  phoneScreenEventCount: number;
  stepsToday: number;
  stepDelta: number;
}

// ── 核心仲裁函数 ─────────────────────────────

/**
 * 对一个时间窗口的所有信号进行状态估计。
 * 关键原则：missing_signal 不等于 observed_zero。只有采集器在线且明确观测到 0，
 * 才能作为“用户无活动”的证据；否则输出 unknown 或降级为中低置信度。
 */
export function arbitrate(window: SignalWindow): DecisionResult {
  const signals = summarizeSignals(window);
  const coverage = buildCoverage(window, signals);
  const evidence = buildEvidence(window, signals, coverage);
  const candidates = scoreCandidates(signals, coverage);
  const winner = chooseWinner(candidates, coverage);
  const confidenceScore = computeConfidenceScore(winner, candidates, coverage);
  const confidence = confidenceFromScore(confidenceScore, winner.state);

  const decision: ActivityDecision = {
    ts: Date.now(),
    userId: window.userId,
    windowStartMs: window.startMs,
    windowEndMs: window.endMs,
    state: winner.state,
    confidence,
    confidenceScore,
    observationCoverage: coverage,
    structuredEvidence: evidence,
    candidates,
    evidence: evidence.map((item) => item.message),
  };

  return { decision, signals, coverage, candidates };
}

function summarizeSignals(window: SignalWindow): SignalSummary {
  const localKeystrokesTotal = window.keyMouseSnapshots.reduce(
    (sum, s) => sum + s.keystrokes + s.mouseClicks,
    0,
  );
  const localMouse = window.keyMouseSnapshots.reduce(
    (sum, s) => sum + s.mouseDistance,
    0,
  );
  const localActivityIntensity = Math.min(
    100,
    Math.round(localKeystrokesTotal * 4 + localMouse / 30),
  );
  const hasLocalActivity = localKeystrokesTotal > 0 || localMouse > 50;
  const hasPhoneActivity = window.phoneScreenEvents.length > 0;
  const stepsToday = window.wechatStepsToday?.steps ?? 0;
  const previousSteps = window.previousWechatStepsToday?.steps ?? stepsToday;
  const stepDelta = Math.max(0, stepsToday - previousSteps);
  const hasStepIncrease = stepDelta > 0;
  const phoneMotionEvents = window.phoneMotionEvents ?? [];
  const hasWalkingMotion = phoneMotionEvents.some(
    (event) => (event.state === 'walking' || event.state === 'running') && event.confidence >= 0.5,
  );
  const hasVehicleMotion = phoneMotionEvents.some(
    (event) => event.state === 'vehicle' && event.confidence >= 0.5,
  );
  const nearKnownDesktop = (window.proximitySignals ?? []).some(
    (signal) => signal.nearKnownDesktop && signal.confidence >= 0.5,
  );
  const hasWebWorkSession = (window.webWorkSessions ?? []).some(
    (session) =>
      session.endedAt == null &&
      session.lastHeartbeatAt >= window.startMs &&
      session.lastHeartbeatAt <= window.endMs,
  );
  const isNightTime = window.localHour >= 23 || window.localHour < 6;
  const isWorkHour = window.localHour >= 9 && window.localHour < 19;

  return {
    hasLocalActivity,
    hasPhoneActivity,
    hasStepIncrease,
    hasWalkingMotion,
    hasVehicleMotion,
    nearKnownDesktop,
    hasWebWorkSession,
    isMultiDevice: window.wechatMultiDeviceActive,
    isNightTime,
    isWorkHour,
    desktopCollectorOnline: window.desktopCollectorOnline ?? false,
    desktopUnlocked: window.desktopUnlocked ?? false,
    localKeystrokesTotal,
    localMouseDistance: Math.round(localMouse),
    localActivityIntensity,
    phoneScreenEventCount: window.phoneScreenEvents.length,
    stepsToday,
    stepDelta,
  };
}

function buildCoverage(window: SignalWindow, signals: SignalSummary): ObservationCoverage {
  const desktopActivity = qualityFromDesktop(window, signals);
  const desktopPresence: SignalQuality =
    window.desktopCollectorOnline === true
      ? window.desktopUnlocked === true
        ? 'observed_positive'
        : 'observed_zero'
      : 'missing';
  const phoneScreen = window.phoneScreenEvents.length > 0 ? 'observed_positive' : 'observed_zero';
  const phoneMotion = qualityFromList(window.phoneMotionEvents);
  const steps =
    window.wechatStepsToday == null
      ? 'missing'
      : signals.hasStepIncrease
        ? 'observed_positive'
        : 'observed_zero';
  const proximity = qualityFromList(window.proximitySignals);
  const webSession = qualityFromList(window.webWorkSessions);

  const qualities = {
    desktopActivity,
    desktopPresence,
    phoneScreen,
    phoneMotion,
    steps,
    proximity,
    webSession,
  };

  const missingReasons = Object.entries(qualities)
    .filter(([, quality]) => quality === 'missing' || quality === 'disabled')
    .map(([source]) => `${source} signal is ${qualities[source as keyof typeof qualities]}`);

  const availableWeight = Object.values(qualities).reduce((sum, quality) => {
    if (quality === 'observed_positive' || quality === 'observed_zero') return sum + 1;
    if (quality === 'stale') return sum + 0.4;
    return sum;
  }, 0);

  return {
    ...qualities,
    coverageScore: round2(availableWeight / Object.values(qualities).length),
    missingReasons,
  };
}

function buildEvidence(
  window: SignalWindow,
  signals: SignalSummary,
  coverage: ObservationCoverage,
): ActivityEvidence[] {
  const evidence: ActivityEvidence[] = [];

  evidence.push({
    source: 'desktop_activity',
    quality: coverage.desktopActivity,
    polarity: signals.hasLocalActivity ? 'supports' : coverage.desktopActivity === 'missing' ? 'neutral' : 'against',
    message: signals.hasLocalActivity
      ? `本机聚合活动强度 ${signals.localActivityIntensity}（仅统计次数/距离，不记录内容）`
      : coverage.desktopActivity === 'missing'
        ? '本机采集器未在线，不能据此判断用户没有使用电脑'
        : '本机采集器在线，当前窗口明确观测到无键鼠活动',
    weight: signals.hasLocalActivity ? 0.9 : 0.45,
  });

  evidence.push({
    source: 'phone_screen',
    quality: coverage.phoneScreen,
    polarity: signals.hasPhoneActivity ? 'supports' : 'neutral',
    message: signals.hasPhoneActivity
      ? `手机在窗口内亮屏/交互 ${signals.phoneScreenEventCount} 次`
      : '手机端未观测到亮屏交互',
    weight: signals.hasPhoneActivity ? 0.55 : 0.2,
  });

  evidence.push({
    source: 'steps',
    quality: coverage.steps,
    polarity: signals.hasStepIncrease ? 'supports' : 'neutral',
    message: coverage.steps === 'missing'
      ? '步数信号缺失，不能判断是否外出'
      : signals.hasStepIncrease
        ? `本窗口步数增加 ${signals.stepDelta} 步`
        : '本窗口步数无增量',
    weight: signals.hasStepIncrease ? 0.65 : 0.25,
  });

  evidence.push({
    source: 'phone_motion',
    quality: coverage.phoneMotion,
    polarity: signals.hasWalkingMotion || signals.hasVehicleMotion ? 'supports' : 'neutral',
    message: signals.hasWalkingMotion
      ? '手机运动状态显示步行/跑步'
      : signals.hasVehicleMotion
        ? '手机运动状态显示交通工具移动'
        : coverage.phoneMotion === 'missing'
          ? '手机运动状态缺失'
          : '手机运动状态未显示明显移动',
    weight: signals.hasWalkingMotion || signals.hasVehicleMotion ? 0.55 : 0.2,
  });

  evidence.push({
    source: 'proximity',
    quality: coverage.proximity,
    polarity: signals.nearKnownDesktop ? 'supports' : 'neutral',
    message: signals.nearKnownDesktop
      ? '手机与已知电脑处于同 WiFi/蓝牙近距环境'
      : '未确认手机靠近已知电脑',
    weight: signals.nearKnownDesktop ? 0.5 : 0.15,
  });

  evidence.push({
    source: 'web_session',
    quality: coverage.webSession,
    polarity: signals.hasWebWorkSession ? 'supports' : 'neutral',
    message: signals.hasWebWorkSession
      ? '检测到用户主动开启的网页工作会话心跳'
      : '未检测到网页工作会话',
    weight: signals.hasWebWorkSession ? 0.75 : 0.1,
  });

  if (window.wechatMultiDeviceActive) {
    evidence.push({
      source: 'wechat_multi_device',
      quality: 'observed_positive',
      polarity: 'supports',
      message: '检测到微信同账号多端在线，可作为其他电脑工作弱证据',
      weight: 0.35,
    });
  }

  evidence.push({
    source: 'time_context',
    quality: 'observed_positive',
    polarity: 'neutral',
    message: signals.isNightTime ? '当前处于深夜休息时段' : signals.isWorkHour ? '当前处于常规工作时段' : '当前处于非典型工作时段',
    weight: 0.2,
  });

  return evidence;
}

function scoreCandidates(
  s: SignalSummary,
  coverage: ObservationCoverage,
): ActivityStateScore[] {
  const scores: ActivityStateScore[] = [
    {
      state: 'working_local',
      score: clamp01(
        (s.hasLocalActivity ? 0.8 : 0) +
          (s.nearKnownDesktop ? 0.1 : 0) +
          (s.isWorkHour ? 0.08 : 0) -
          (s.hasWalkingMotion ? 0.2 : 0),
      ),
      reasons: compact([
        s.hasLocalActivity && `本机活动强度 ${s.localActivityIntensity}`,
        s.nearKnownDesktop && '手机靠近已知电脑',
        s.isWorkHour && '处于常规工作时段',
      ]),
    },
    {
      state: 'working_remote',
      score: clamp01(
        (s.hasWebWorkSession ? 0.75 : 0) +
          (s.isMultiDevice ? 0.25 : 0) +
          (s.hasPhoneActivity && s.isWorkHour ? 0.12 : 0) +
          (!s.hasLocalActivity && coverage.desktopActivity === 'missing' ? 0.2 : 0) -
          (s.hasWalkingMotion || s.hasVehicleMotion ? 0.2 : 0),
      ),
      reasons: compact([
        s.hasWebWorkSession && '主动网页工作会话在线',
        s.isMultiDevice && '微信多端在线',
        coverage.desktopActivity === 'missing' && '本机信号缺失，不能排除公共电脑',
        s.hasPhoneActivity && s.isWorkHour && '工作时间手机活跃',
      ]),
    },
    {
      state: 'phone_active',
      score: clamp01(
        (s.hasPhoneActivity ? 0.62 : 0) +
          (!s.hasLocalActivity && coverage.desktopActivity !== 'missing' ? 0.18 : 0) -
          (s.hasWalkingMotion ? 0.15 : 0),
      ),
      reasons: compact([
        s.hasPhoneActivity && '手机亮屏/交互活跃',
        !s.hasLocalActivity && coverage.desktopActivity !== 'missing' && '本机明确无活动',
      ]),
    },
    {
      state: 'walking_or_commuting',
      score: clamp01(
        (s.hasStepIncrease ? 0.45 : 0) +
          (s.hasWalkingMotion ? 0.35 : 0) +
          (s.hasVehicleMotion ? 0.32 : 0) -
          (s.hasLocalActivity ? 0.25 : 0),
      ),
      reasons: compact([
        s.hasStepIncrease && `步数增加 ${s.stepDelta}`,
        s.hasWalkingMotion && '手机运动状态为步行/跑步',
        s.hasVehicleMotion && '手机运动状态为交通工具移动',
      ]),
    },
    {
      state: 'sleeping',
      score: clamp01(
        (s.isNightTime ? 0.5 : 0) +
          (!s.hasLocalActivity && coverage.desktopActivity !== 'missing' ? 0.18 : 0) +
          (!s.hasPhoneActivity ? 0.15 : 0) -
          (s.hasStepIncrease || s.hasWalkingMotion ? 0.3 : 0),
      ),
      reasons: compact([
        s.isNightTime && '深夜时段',
        !s.hasLocalActivity && coverage.desktopActivity !== 'missing' && '本机明确无活动',
        !s.hasPhoneActivity && '手机无亮屏交互',
      ]),
    },
    {
      state: 'idle_confirmed',
      score: clamp01(
        (!s.hasLocalActivity && coverage.desktopActivity === 'observed_zero' ? 0.32 : 0) +
          (!s.hasPhoneActivity && coverage.phoneScreen === 'observed_zero' ? 0.22 : 0) +
          (!s.hasStepIncrease && coverage.steps === 'observed_zero' ? 0.18 : 0) -
          (coverage.coverageScore < 0.55 ? 0.25 : 0),
      ),
      reasons: compact([
        coverage.desktopActivity === 'observed_zero' && '本机明确无活动',
        coverage.phoneScreen === 'observed_zero' && '手机明确无亮屏',
        coverage.steps === 'observed_zero' && '步数明确无增量',
      ]),
    },
    {
      state: 'unknown',
      score: clamp01(
        (coverage.coverageScore < 0.45 ? 0.75 : 0.15) +
          (coverage.desktopActivity === 'missing' ? 0.15 : 0) +
          (coverage.steps === 'missing' ? 0.1 : 0),
      ),
      reasons: compact([
        coverage.coverageScore < 0.45 && `观测覆盖率低：${coverage.coverageScore}`,
        coverage.missingReasons.length > 0 && `缺失信号：${coverage.missingReasons.join(', ')}`,
      ]),
    },
  ];

  return scores
    .map((candidate) => ({ ...candidate, score: round2(candidate.score) }))
    .sort((a, b) => b.score - a.score);
}

function chooseWinner(
  candidates: ActivityStateScore[],
  coverage: ObservationCoverage,
): ActivityStateScore {
  const top = candidates[0] ?? { state: 'unknown' as const, score: 1, reasons: ['无候选状态'] };

  // 覆盖率太低时，除非有主动网页工作会话或明确本机活动，否则不下强结论。
  if (coverage.coverageScore < 0.35 && top.state !== 'working_local' && top.state !== 'working_remote') {
    return candidates.find((c) => c.state === 'unknown') ?? top;
  }

  if (top.score < 0.4) {
    return candidates.find((c) => c.state === 'unknown') ?? top;
  }

  return top;
}

function computeConfidenceScore(
  winner: ActivityStateScore,
  candidates: ActivityStateScore[],
  coverage: ObservationCoverage,
): number {
  const runnerUp = candidates.find((candidate) => candidate.state !== winner.state);
  const separation = winner.score - (runnerUp?.score ?? 0);
  const score = winner.score * 0.65 + coverage.coverageScore * 0.25 + Math.max(0, separation) * 0.1;
  return round2(clamp01(score));
}

function confidenceFromScore(score: number, state: ActivityState): ConfidenceLevel {
  if (state === 'unknown') return 'uncertain';
  if (score >= 0.72) return 'high';
  if (score >= 0.5) return 'medium';
  return 'low';
}

function qualityFromDesktop(window: SignalWindow, signals: SignalSummary): SignalQuality {
  if (window.desktopCollectorOnline !== true) return 'missing';
  if (signals.hasLocalActivity) return 'observed_positive';
  const hasExplicitIdle = window.keyMouseSnapshots.some((snapshot) => snapshot.observedIdle === true);
  return hasExplicitIdle || window.desktopUnlocked === true ? 'observed_zero' : 'stale';
}

function qualityFromList(list: unknown[] | undefined): SignalQuality {
  if (list == null) return 'missing';
  return list.length > 0 ? 'observed_positive' : 'observed_zero';
}

function compact(values: Array<string | false | undefined>): string[] {
  return values.filter((value): value is string => typeof value === 'string' && value.length > 0);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// ── 工具：生成当前时间窗口 ───────────────────

export function currentWindow(userId: string): Pick<SignalWindow, 'startMs' | 'endMs' | 'userId' | 'localHour'> {
  const now = Date.now();
  const localHour = new Date(now).getHours();
  return {
    userId,
    startMs: now - WINDOW_MINUTES * 60 * 1000,
    endMs: now,
    localHour,
  };
}

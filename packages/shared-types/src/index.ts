// ─────────────────────────────────────────────
// Health Buddy — 核心共享类型定义
// 所有跨端模块（desktop / mobile / server）共用此文件中的类型。
//
// MVP 阶段：优先保证 PetConfig、HealthSnapshot 与 apps/web 一致。
// 新增字段请先三人同步；breaking 变更标注 phase-2/3。
// ─────────────────────────────────────────────

// ── 设备类型 ──────────────────────────────────

export type DeviceKind = 'desktop' | 'mobile';

export interface DeviceInfo {
  deviceId: string;      // 本机唯一标识（UUID，首次运行生成）
  kind: DeviceKind;
  platform: 'win32' | 'darwin' | 'linux' | 'ios' | 'android';
  userId: string;
}

// ── 原始事件（L1 采集层输出）─────────────────

/** 键鼠活动快照，每分钟采集一次 */
export interface KeyMouseSnapshot {
  ts: number;            // Unix 毫秒时间戳
  deviceId: string;
  keystrokes: number;    // 本分钟击键次数
  mouseDistance: number; // 鼠标移动总像素距离
  mouseClicks: number;
  /** 是否明确观测到本分钟没有活动。true 表示采集器在线且数据为 0，不是信号缺失。 */
  observedIdle?: boolean;
  /** 活动强度 0–100，只保留聚合值，避免记录具体输入内容或精确轨迹。 */
  activityIntensity?: number;
  activeWindowTitle?: string;
}

/** 手机亮屏 / 解锁事件 */
export interface PhoneScreenEvent {
  ts: number;
  deviceId: string;
  type: 'unlock' | 'lock' | 'interactive';
  durationMs?: number;   // 亮屏持续时间（lock 事件时填写）
}

/** 手机端低敏运动状态，用于区分外出、通勤、静置和手机离身。 */
export interface PhoneMotionEvent {
  ts: number;
  deviceId: string;
  state: 'stationary' | 'walking' | 'running' | 'vehicle' | 'unknown';
  confidence: number;    // 0–1，来自系统 Activity Recognition / Core Motion
}

/** 手机与桌面端的近距信号，不记录精确位置，仅用于判断用户是否靠近自己的电脑。 */
export interface ProximitySignal {
  ts: number;
  userId: string;
  source: 'same_wifi' | 'bluetooth' | 'local_network_ping' | 'manual_session';
  nearKnownDesktop: boolean;
  confidence: number;    // 0–1
  desktopDeviceId?: string;
}

/** 用户主动开启的轻量 Web 会话，适合公共电脑场景，只表示“我正在电脑前”。 */
export interface WebWorkSession {
  sessionId: string;
  userId: string;
  startedAt: number;
  lastHeartbeatAt: number;
  endedAt?: number;
  source: 'browser_tab' | 'browser_extension' | 'qr_login';
}

/** 微信运动步数（每日汇总或实时推送） */
export interface WechatStepRecord {
  date: string;          // YYYY-MM-DD
  userId: string;
  steps: number;
  source: 'wechat_motion' | 'healthkit' | 'google_fit';
}

/** rPPG 心率检测结果（摄像头本地推断后上报） */
export interface HeartRateSample {
  ts: number;
  deviceId: string;
  bpm: number;
  confidence: number;    // 0–1，推断置信度
  method: 'rppg' | 'wifi_csi';
}

// ── 决策仲裁层（L2 输出）─────────────────────

/** 置信度等级 */
export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'uncertain';

/** 单类信号在当前窗口内的观测质量。 */
export type SignalQuality = 'observed_positive' | 'observed_zero' | 'missing' | 'stale' | 'disabled';

/** 证据对状态判断的贡献方向。 */
export type EvidencePolarity = 'supports' | 'against' | 'neutral';

/** 决策证据，面向调试和树屋中的“为什么这样判断”。 */
export interface ActivityEvidence {
  source:
    | 'desktop_activity'
    | 'desktop_presence'
    | 'phone_screen'
    | 'phone_motion'
    | 'steps'
    | 'proximity'
    | 'web_session'
    | 'wechat_multi_device'
    | 'time_context';
  quality: SignalQuality;
  polarity: EvidencePolarity;
  message: string;
  weight: number;        // 0–1，当前证据对最终状态的影响强度
}

/** 当前窗口中各类信号的覆盖情况。 */
export interface ObservationCoverage {
  desktopActivity: SignalQuality;
  desktopPresence: SignalQuality;
  phoneScreen: SignalQuality;
  phoneMotion: SignalQuality;
  steps: SignalQuality;
  proximity: SignalQuality;
  webSession: SignalQuality;
  /** 0–1，越高代表越能下结论；低覆盖率时应输出 unknown 或降级提醒。 */
  coverageScore: number;
  missingReasons: string[];
}

/** 用户当前活动状态，经仲裁层推断后的结论 */
export type ActivityState =
  | 'working_local'       // 在本机工作
  | 'working_remote'      // 异地工作（其他电脑）
  | 'phone_active'        // 主要在使用手机
  | 'walking_or_commuting' // 步行、通勤、外出
  | 'sleeping'            // 睡眠中
  | 'idle_confirmed'      // 确认空闲
  | 'unknown'             // 信号不足，不做强判断
  // 兼容早期代码，后续逐步迁移到上面的新状态名。
  | 'walking_outdoor'
  | 'phone_only'
  | 'idle'
  | 'uncertain';

/** 候选状态及其得分，用于解释“为什么不是另一个状态”。 */
export interface ActivityStateScore {
  state: ActivityState;
  score: number;         // 0–1
  reasons: string[];
}

/** 状态估计器的完整输出。 */
export interface EstimatedActivityState {
  ts: number;
  userId: string;
  windowStartMs: number;
  windowEndMs: number;
  state: ActivityState;
  confidence: ConfidenceLevel;
  confidenceScore: number; // 0–1
  observationCoverage: ObservationCoverage;
  evidence: ActivityEvidence[];
  candidates: ActivityStateScore[];
}

export interface ActivityDecision {
  ts: number;
  userId: string;
  windowStartMs: number;  // 仲裁时间窗口起点
  windowEndMs: number;
  state: ActivityState;
  confidence: ConfidenceLevel;
  confidenceScore?: number;
  observationCoverage?: ObservationCoverage;
  structuredEvidence?: ActivityEvidence[];
  candidates?: ActivityStateScore[];
  evidence: string[];     // 推断依据描述，用于调试与解释
}

// ── 健康分析层（L3 输出）─────────────────────

/** 每小时健康快照，经 AI 分析后生成 */
export interface HealthSnapshot {
  ts: number;
  userId: string;
  sedentaryMinutes: number;          // 本小时内累计久坐分钟
  heartRateBpm?: number;             // 平均心率（若有采样）
  fatigueScore: number;              // 0–100，越高越疲劳
  stressScore: number;               // 0–100，越高压力越大
  hydrationReminderDue: boolean;     // 是否应提醒喝水
  sleepQuality?: number;             // 0–100，仅有昨夜数据时填写
  notes?: string;                    // AI 分析文字摘要
}

/** 每日汇总健康报告 */
export interface DailyHealthReport {
  date: string;           // YYYY-MM-DD
  userId: string;
  totalActiveMinutes: number;
  totalSedentaryMinutes: number;
  totalSteps: number;
  avgHeartRateBpm?: number;
  avgFatigueScore: number;
  sleepDurationMinutes?: number;
  sleepQuality?: number;
  aiSummary: string;      // AI 生成的每日健康总结
}

// ── 行为映射层（L4 输出）─────────────────────

/** 宠物行为触发事件 */
export type PetTriggerKind =
  | 'remind_move'         // 提醒站起来活动
  | 'remind_drink'        // 提醒喝水
  | 'remind_sleep'        // 提醒睡觉
  | 'celebrate_steps'     // 步数目标达成
  | 'play_music'          // 播放舒缓音乐
  | 'tell_story'          // 讲故事
  | 'idle_companion'      // 安静陪伴
  | 'custom';             // 自定义（LLM 自由发挥）

export interface PetTrigger {
  id: string;
  kind: PetTriggerKind;
  priority: 'high' | 'normal' | 'low';
  payload?: Record<string, unknown>;  // 附加参数（如音乐风格、故事类型）
  expireAt?: number;      // 超时未展示则丢弃
}

// ── 宠物配置（L5 用户偏好）────────────────────

export type PetPersonality =
  | 'gentle'              // 温柔治愈
  | 'tsundere'            // 傲娇吐槽
  | 'cheerful'            // 活泼开朗
  | 'calm'                // 沉稳冷静
  | 'playful';            // 调皮捣蛋

export type BirdSpecies =
  | 'sparrow'             // 麻雀
  | 'parakeet'            // 长尾鹦鹉
  | 'cockatiel'           // 玄凤鹦鹉
  | 'canary'              // 金丝雀
  | 'shrike'              // 伯劳
  | 'swift';              // 雨燕

export interface PetConfig {
  userId?: string;        // 未登录时可省略，使用本地 ID
  name: string;
  gender: 'male' | 'female' | 'unset';
  species: BirdSpecies;
  featherColor: string;   // CSS color token key，从预设色板选择
  personality: PetPersonality;
  voiceStyle?: 'soft' | 'lively' | 'calm';
  enableCamera?: boolean; // 是否允许 rPPG 摄像头
  enableVoice?: boolean;  // 是否启用 TTS 语音
}

// ── 用户偏好（树屋界面收集）──────────────────

export interface UserPreferences {
  userId: string;
  hobbies: string[];                        // 用户填写的兴趣爱好
  musicGenres: string[];                    // 偏好音乐风格
  workSchedule: {
    workStartHour: number;                  // 工作开始时间（0–23）
    workEndHour: number;
    workDays: Array<0 | 1 | 2 | 3 | 4 | 5 | 6>; // 0=周日
  };
  healthGoals: {
    dailyStepsTarget: number;
    sedentaryLimitMinutes: number;          // 最长连续久坐分钟
    hydrationIntervalMinutes: number;       // 提醒喝水间隔
    sleepTargetHour: number;                // 目标入睡时间
  };
  updatedAt: number;
}

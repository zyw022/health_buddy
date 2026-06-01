// ─────────────────────────────────────────────
// apps/mobile/src/collector/lowFrictionSignals.ts
//
// TODO(phase-2): 接入 expo-sensors / HealthKit / Google Fit 真实步数与运动状态。
// TODO(phase-2): AppState 亮屏事件；近距信号（同 WiFi / 蓝牙）可选。
// MVP 阶段不运行本模块。
// ─────────────────────────────────────────────

import type {
  PhoneMotionEvent,
  PhoneScreenEvent,
  ProximitySignal,
  WechatStepRecord,
} from '@health-buddy/shared-types';

export interface MobileSignalBatch {
  userId: string;
  deviceId: string;
  collectedAt: number;
  screenEvents: PhoneScreenEvent[];
  motionEvents: PhoneMotionEvent[];
  stepRecord?: WechatStepRecord;
  proximitySignals: ProximitySignal[];
}

export interface MobileCollectorConfig {
  userId: string;
  deviceId: string;
  enableScreenEvents: boolean;
  enableSteps: boolean;
  enableMotionState: boolean;
  enableProximity: boolean;
}

/**
 * 手机端采集协调器。
 *
 * Android：
 * - 屏幕事件：ACTION_SCREEN_ON / ACTION_SCREEN_OFF / USER_PRESENT
 * - 步数：Sensor.TYPE_STEP_COUNTER 或 Health Connect
 * - 使用时长增强：UsageStatsManager，需要用户去系统设置手动授权
 *
 * iOS：
 * - 步数/运动：HealthKit + Core Motion
 * - 使用时长增强：Screen Time / Device Activity，权限较重，默认不启用
 *
 * MVP 推荐只启用 steps + motion + app heartbeat，不默认请求应用使用统计权限。
 */
export class LowFrictionMobileCollector {
  private screenEvents: PhoneScreenEvent[] = [];
  private motionEvents: PhoneMotionEvent[] = [];
  private proximitySignals: ProximitySignal[] = [];
  private latestSteps?: WechatStepRecord;

  constructor(private readonly config: MobileCollectorConfig) {}

  recordScreenEvent(event: Omit<PhoneScreenEvent, 'deviceId'>): void {
    if (!this.config.enableScreenEvents) return;
    this.screenEvents.push({ ...event, deviceId: this.config.deviceId });
  }

  recordMotionEvent(event: Omit<PhoneMotionEvent, 'deviceId'>): void {
    if (!this.config.enableMotionState) return;
    this.motionEvents.push({ ...event, deviceId: this.config.deviceId });
  }

  recordStepSnapshot(steps: number, source: WechatStepRecord['source']): void {
    if (!this.config.enableSteps) return;
    this.latestSteps = {
      date: new Date().toISOString().slice(0, 10),
      userId: this.config.userId,
      steps,
      source,
    };
  }

  recordProximity(signal: Omit<ProximitySignal, 'userId'>): void {
    if (!this.config.enableProximity) return;
    this.proximitySignals.push({ ...signal, userId: this.config.userId });
  }

  flushBatch(): MobileSignalBatch {
    const batch: MobileSignalBatch = {
      userId: this.config.userId,
      deviceId: this.config.deviceId,
      collectedAt: Date.now(),
      screenEvents: this.screenEvents,
      motionEvents: this.motionEvents,
      proximitySignals: this.proximitySignals,
    };

    if (this.latestSteps != null) {
      batch.stepRecord = this.latestSteps;
    }

    this.screenEvents = [];
    this.motionEvents = [];
    this.proximitySignals = [];

    return batch;
  }
}

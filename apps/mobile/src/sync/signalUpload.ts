// ─────────────────────────────────────────────
// apps/mobile/src/sync/signalUpload.ts
//
// TODO(phase-2): 对接 POST /api/mobile/signals；前台/后台降频见 MOBILE_UPLOAD_POLICY。
// TODO(phase-2): 离线队列与 JWT 鉴权（勿信任 body 内 userId）。
// MVP 阶段不运行本模块。
// ─────────────────────────────────────────────

import type { MobileSignalBatch } from '../collector/lowFrictionSignals';

export interface SignalUploadClient {
  uploadMobileSignals(batch: MobileSignalBatch): Promise<void>;
}

export class HttpSignalUploadClient implements SignalUploadClient {
  constructor(
    private readonly endpoint: string,
    private readonly getAuthToken: () => Promise<string>,
  ) {}

  async uploadMobileSignals(batch: MobileSignalBatch): Promise<void> {
    const token = await this.getAuthToken();
    const response = await fetch(`${this.endpoint}/api/mobile/signals`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(batch),
    });

    if (!response.ok) {
      throw new Error(`Failed to upload mobile signals: ${response.status}`);
    }
  }
}

/**
 * 上传节流策略：
 * - 前台：1 分钟一批
 * - 后台：5 到 15 分钟一批，按系统后台任务能力执行
 * - 无网络：本地队列缓存，最多保留 24 小时
 */
export const MOBILE_UPLOAD_POLICY = {
  foregroundIntervalMs: 60_000,
  backgroundIntervalMs: 5 * 60_000,
  maxOfflineQueueMs: 24 * 60 * 60 * 1000,
} as const;

// ─────────────────────────────────────────────
// apps/mobile — React Native / Expo 入口
//
// TODO(phase-2): Expo 工程配置（app.json）、权限引导、与 server 账号绑定。
// MVP 阶段：仅导出 collector / sync 模块供类型检查。
// ─────────────────────────────────────────────

export {
  LowFrictionMobileCollector,
  type MobileCollectorConfig,
  type MobileSignalBatch,
} from './collector/lowFrictionSignals';
export {
  HttpSignalUploadClient,
  MOBILE_UPLOAD_POLICY,
  type SignalUploadClient,
} from './sync/signalUpload';

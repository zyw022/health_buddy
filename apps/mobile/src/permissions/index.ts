// ─────────────────────────────────────────────
// apps/mobile/src/permissions/index.ts
//
// 运行时权限引导——在首次启动时向用户说明采集内容并请求权限。
//
// TODO(phase-2): 实现 requestMotionPermission()（iOS CMMotionActivityManager）。
// TODO(phase-2): 实现 requestHealthPermission()（HealthKit 步数读取）。
// TODO(phase-2): Android ActivityRecognition 权限请求。
// ─────────────────────────────────────────────

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export interface MobilePermissions {
  motion: PermissionStatus;
  health: PermissionStatus;
}

/** 检查并请求所有需要的权限，返回最终状态。 */
export async function requestAllPermissions(): Promise<MobilePermissions> {
  // TODO(phase-2): 实现真实权限请求
  return { motion: 'undetermined', health: 'undetermined' };
}

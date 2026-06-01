// ─────────────────────────────────────────────
// apps/mobile/src/auth/binding.ts
//
// 手机端与桌面/Web 同账号绑定逻辑。
//
// TODO(phase-2): 实现扫码（二维码）或输入 6 位 code 绑定 userId。
// TODO(phase-2): 绑定成功后保存 userId + deviceId 到 AsyncStorage。
// TODO(phase-2): 绑定态后 signalUpload 自动携带正确 userId。
// ─────────────────────────────────────────────

export interface BindingState {
  userId: string | null;
  deviceId: string;
  boundAt: number | null;
}

/** 读取本地绑定状态。 */
export async function getBindingState(): Promise<BindingState> {
  // TODO(phase-2): 从 AsyncStorage 读取
  return { userId: null, deviceId: 'mock-device', boundAt: null };
}

/** 用扫码 / code 完成绑定并持久化。 */
export async function bindWithCode(_code: string): Promise<BindingState> {
  // TODO(phase-2): POST /api/mobile/bind，保存 token 与 userId
  throw new Error('TODO(phase-2): binding not implemented');
}

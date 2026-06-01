// ─────────────────────────────────────────────
// apps/desktop-pet/src/pet-ui/index.ts — Electron 渲染进程宠物 UI 入口
//
// TODO(phase-2): 在 Electron 渲染进程中挂载 apps/web 的 PetSprite + SpeechBubble。
// TODO(phase-2): 订阅 window.healthBuddy.onPetAction()，切换小鸟动作。
// TODO(phase-2): 订阅 window.healthBuddy.onHealthUpdate()，刷新气泡台词。
// TODO(phase-2): 与 web 共享 petStore（localStorage 同域）或通过 IPC 同步配置。
// ─────────────────────────────────────────────

export const PET_UI_PHASE = 'phase-2' as const;

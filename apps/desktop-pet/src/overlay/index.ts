// ─────────────────────────────────────────────
// apps/desktop-pet/src/overlay/index.ts — 透明悬浮窗行为
//
// TODO(phase-2): 窗口拖拽：ipcMain 监听 mousedown/mousemove，调用 win.setPosition()。
// TODO(phase-2): 穿透鼠标点击（setIgnoreMouseEvents true/false 切换）。
// TODO(phase-2): 双击小鸟区域 → ipcRenderer.send('open-treehouse')。
// TODO(phase-2): 多显示器感知：窗口跨屏时 clamp 到当前显示器边界。
// ─────────────────────────────────────────────

export const OVERLAY_PHASE = 'phase-2' as const;

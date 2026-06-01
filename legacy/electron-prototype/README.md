# legacy/electron-prototype

同学提交的原始 Electron 原型，**完整保留，不做修改**。

| 文件 | 说明 |
|------|------|
| `main.js`        | Electron 主进程：Pet 窗口 + 树屋窗口 + IPC + 全局快捷键 |
| `preload.js`     | contextBridge 安全桥，暴露 `electronAPI` |
| `pet.html`       | 桌宠浮窗 UI + Canvas 序列帧动画引擎 |
| `treehouse.html` | 树屋仪表盘：入场动画 / 宠物选择 / 数据展示 |
| `animations/`    | PNG 帧图片目录（见内部 README） |

## 运行原型

```bash
# 从仓库根目录
npm run prototype        # 完整模式（Pet + 树屋）
npm run prototype:dev    # 开发模式（带 DevTools）
npm run prototype:pet    # 仅 Pet 浮窗（--pet-only）
```

需要先全局安装 Electron，或在根目录 `npm install` 后确认 `electron` 出现在 `node_modules/.bin`。

## 迁移计划

| 原型内容 | 目标位置 | 阶段 |
|----------|----------|------|
| Canvas 序列帧引擎（`pet.html`） | `apps/web/src/components/PetSprite.tsx` | Phase 1 ✅ |
| 树屋 CSS 设计规范变量 | `apps/web/src/index.css` | Phase 1 ✅ |
| 树屋入场 + 萤火虫特效 | `apps/web/src/components/TreeHouseScene.tsx` | Phase 1 ✅ |
| Electron 窗口逻辑（`main.js`） | `apps/desktop-pet/src/main.ts` | Phase 2 |
| IPC Bridge（`preload.js`） | `apps/desktop-pet/src/preload.ts` | Phase 2 |

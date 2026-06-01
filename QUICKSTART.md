# Health Buddy — 新人 5 分钟启动指南

## 环境要求

| 工具 | 版本 | 检查命令 |
|------|------|---------|
| Node.js | >= 20 | `node -v` |
| npm | >= 9（npm workspaces 支持） | `npm -v` |

> Python / Expo / Electron **MVP 阶段不需要**。

---

## 第一步：克隆仓库

```bash
git clone https://github.com/zyw022/health_buddy.git
cd health_buddy
```

---

## 第二步：安装依赖

```bash
npm install
```

安装完成后 `node_modules/@health-buddy/shared-types` 会自动 symlink 到 `packages/shared-types`。

> **如遇 peer dependency 警告：** 加 `--legacy-peer-deps` 重试。
> ```bash
> npm install --legacy-peer-deps
> ```

---

## 第三步：启动 Web MVP

```bash
npm run dev:web
```

浏览器打开终端输出的地址（默认 `http://localhost:5173`）。

---

## 第四步：体验完整流程

1. 看到树屋 → 点击木门
2. 选择小鸟种类、毛色、性别、性格、名字（四步）
3. 进入 Dashboard，小鸟会说一句关怀的话
4. 点击小鸟可互动
5. 右上角 ↻ 按钮可刷新健康状态

---

## 目录速查（只改 MVP 部分）

```
apps/web/src/
├── pages/            路由页面（A 负责）
├── components/       小鸟 + 气泡 + 健康卡片（A 负责）
├── store/petStore.ts 全局状态（A 负责）
└── mock/
    ├── healthData.ts          mock 健康数据（C 负责）
    └── petBehaviorMapping.ts  健康→动作→台词（C 负责）

packages/shared-types/src/index.ts  核心类型（三人共用，改前同步）
```

**MVP 不需要启动：**
- `apps/server/` — Phase 2 后端
- `apps/mobile/` — Phase 2 手机端
- `apps/desktop-pet/` — Phase 2 Electron

---

## 常见问题

**Q: `Cannot find module '@health-buddy/shared-types'`**

确保 `npm install` 已在根目录执行，且存在 `node_modules/@health-buddy/shared-types` 目录。

**Q: 端口被占用**

```bash
# 改用其他端口
npm run dev:web -- --port 3000
```

**Q: TypeScript 报错阻止启动**

先检查 `packages/shared-types/src/index.ts` 的字段是否与 mock 数据一致。

---

## 提交规范

| 类型 | 含义 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat: 增加 happy 台词` |
| `fix` | bug 修复 | `fix: 选宠刷新后丢失` |
| `style` | 样式调整 | `style: 调整树屋背景色` |
| `chore` | 构建/依赖 | `chore: 更新 vite 版本` |

**MVP 阶段只改 `apps/web/` 和 `packages/shared-types`，其他模块改动请在 PR 标题加 `[phase-2]`。**

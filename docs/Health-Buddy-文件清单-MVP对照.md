# Health Buddy — 仓库文件清单 & MVP 对照

> 生成日期：2026-06-01  
> 图例：**☑** = MVP 必须实现 · **☐** = Phase 2/3 或仅骨架占位  
> MVP 目标：浏览器打开 → 树屋门开 → 选小鸟 → Dashboard 用 mock 数据展示关怀话

---

## 统计摘要

| 类别 | 文件数 | MVP ☑ | 非 MVP ☐ |
|------|:------:|:-----:|:--------:|
| 根目录 | 3 | 2 | 1 |
| apps/web | 24 | 23 | 1 |
| apps/desktop-pet | 10 | 0 | 10 |
| apps/mobile | 9 | 0 | 9 |
| apps/server | 16 | 0 | 16 |
| apps/treehouse | 2 | 0 | 2 |
| packages | 18 | 3 | 15 |
| infra / CI | 3 | 0 | 3 |
| assetstore | 3 | 0 | 3 |
| **合计** | **88** | **25** | **63** |

---

## 目录树（☑ = MVP · ☐ = 后续阶段）

```
health_buddy/
├── ☑ package.json                          # Monorepo 根配置、dev:web 脚本
├── ☑ tsconfig.base.json                    # 共享 TypeScript 配置
├── ☐ readme.md                             # 项目文档（非运行时）
│
├── .github/
│   └── workflows/
│       └── ☐ ci.yml                        # CI 占位（Phase 2+）
│
├── infra/
│   ├── ☐ README.md                         # 部署说明占位
│   └── ☐ docker-compose.yml                # 本地联调占位
│
├── assetstore/
│   ├── ☐ chicken3.jpg                      # 素材资源（MVP 未引用）
│   ├── ☐ little_chicken1.jpg
│   └── ☐ little_chicken2.jpg
│
├── apps/
│   │
│   ├── web/                                ── Phase 1 MVP 主交付面 ──
│   │   ├── ☑ package.json
│   │   ├── ☑ vite.config.ts
│   │   ├── ☑ tsconfig.json
│   │   ├── ☑ index.html
│   │   ├── ☑ tailwind.config.ts
│   │   ├── ☑ postcss.config.js
│   │   └── src/
│   │       ├── ☑ main.tsx
│   │       ├── ☑ App.tsx                   # 路由 / · /select-pet · /dashboard
│   │       ├── ☑ index.css
│   │       ├── pages/
│   │       │   ├── TreeHouseEntry/
│   │       │   │   └── ☑ index.tsx         # 树屋开场动画
│   │       │   ├── PetSelection/
│   │       │   │   └── ☑ index.tsx         # 四步选宠
│   │       │   └── Dashboard/
│   │       │       └── ☑ index.tsx         # 主界面
│   │       ├── components/
│   │       │   ├── ☑ TreeHouseScene.tsx    # 坡屋顶树屋 SVG
│   │       │   ├── ☑ PetSprite.tsx         # 小鸟动画
│   │       │   ├── ☑ SpeechBubble.tsx      # 说话气泡
│   │       │   └── ☑ HealthCards.tsx        # 健康卡片
│   │       ├── store/
│   │       │   └── ☑ petStore.ts           # 选宠 + localStorage
│   │       ├── mock/
│   │       │   ├── ☑ healthData.ts          # 模拟 HealthSnapshot
│   │       │   └── ☑ petBehaviorMapping.ts  # 健康→动作→台词
│   │       └── hooks/
│   │           └── ☐ useHealthSnapshot.ts  # Phase 2 WebSocket 接入占位
│   │
│   ├── desktop-pet/                        ── Phase 2 Electron 桌宠 ──
│   │   ├── ☐ package.json
│   │   ├── ☐ tsconfig.json
│   │   ├── ☐ tsconfig.main.json
│   │   └── src/
│   │       ├── ☐ main.ts                   # Electron 主进程
│   │       ├── ☐ preload.ts                # IPC 预加载
│   │       ├── collector/
│   │       │   ├── ☐ keyMouse.ts           # 键鼠采集
│   │       │   └── ☐ decisionLoop.ts       # 决策循环
│   │       ├── ipc/
│   │       │   └── ☐ types.ts              # IPC 通道定义
│   │       ├── overlay/
│   │       │   └── ☐ index.ts              # 透明悬浮窗
│   │       └── pet-ui/
│   │           └── ☐ index.ts              # 宠物 UI 渲染
│   │
│   ├── mobile/                             ── Phase 2 React Native / Expo ──
│   │   ├── ☐ app.json
│   │   ├── ☐ package.json
│   │   ├── ☐ tsconfig.json
│   │   └── src/
│   │       ├── ☐ App.tsx
│   │       ├── ☐ index.ts
│   │       ├── auth/
│   │       │   └── ☐ binding.ts            # 扫码绑定账号
│   │       ├── collector/
│   │       │   └── ☐ lowFrictionSignals.ts # 步数/亮屏采集
│   │       ├── permissions/
│   │       │   └── ☐ index.ts              # 权限引导
│   │       └── sync/
│   │           └── ☐ signalUpload.ts       # 信号上报
│   │
│   ├── server/                             ── Phase 2 后端（Hono + SQLite）──
│   │   ├── ☐ package.json
│   │   ├── ☐ tsconfig.json
│   │   ├── ☐ requirements.txt              # Python 桩依赖
│   │   └── src/
│   │       ├── ☐ index.ts                  # Hono 入口
│   │       ├── ☐ main.py                   # FastAPI 桩（待弃用）
│   │       ├── ☐ __init__.py
│   │       ├── api/
│   │       │   ├── ☐ __init__.py
│   │       │   ├── ☐ mobile_signals.py     # Python 桩
│   │       │   └── ☐ web_work_sessions.py  # Python 桩
│   │       ├── routes/
│   │       │   ├── ☐ mobileSignals.ts
│   │       │   ├── ☐ workSessions.ts
│   │       │   ├── ☐ petConfig.ts
│   │       │   └── ☐ health.ts
│   │       ├── db/
│   │       │   └── ☐ sqlite.ts
│   │       ├── scheduler/
│   │       │   └── ☐ index.ts              # 定时任务
│   │       └── ws/
│   │           └── ☐ hub.ts                # WebSocket 推送
│   │
│   └── treehouse/                          ── 遗留目录（已合并进 web）──
│       └── src/
│           ├── charts/
│           │   └── ☐ README.md
│           └── settings/
│               └── ☐ README.md
│
└── packages/
    │
    ├── shared-types/                       ── MVP 类型依赖 ──
    │   ├── ☑ package.json
    │   ├── ☑ tsconfig.json
    │   └── src/
    │       └── ☑ index.ts                  # PetConfig · HealthSnapshot 等
    │
    ├── decision-engine/                    ── Phase 2 决策仲裁 ──
    │   ├── ☐ package.json
    │   ├── ☐ tsconfig.json
    │   └── src/
    │       └── ☐ index.ts
    │
    ├── health-engine/                      ── Phase 2/3 健康分析 ──
    │   ├── ☐ package.json
    │   ├── ☐ tsconfig.json
    │   └── src/
    │       └── ☐ index.ts
    │
    ├── pet-engine/                         ── Phase 2/3 行为映射 ──
    │   ├── ☐ package.json
    │   ├── ☐ tsconfig.json
    │   └── src/
    │       └── ☐ index.ts
    │
    └── llm-client/                         ── Phase 3 LLM 封装 ──
        ├── ☐ package.json
        ├── ☐ tsconfig.json
        └── src/
            ├── ☐ index.ts
            ├── ☐ types.ts
            ├── ☐ client.ts
            └── prompts/
                └── ☐ personalityPrompt.ts
```

---

## 扁平文件列表（按路径排序）

| MVP | 路径 | 阶段 | 说明 |
|:---:|------|:----:|------|
| ☑ | `package.json` | P1 | Monorepo 根配置 |
| ☑ | `tsconfig.base.json` | P1 | 共享 TS 配置 |
| ☐ | `readme.md` | — | 项目文档 |
| ☐ | `.github/workflows/ci.yml` | P2+ | CI 占位 |
| ☐ | `infra/README.md` | P2+ | 部署说明 |
| ☐ | `infra/docker-compose.yml` | P2+ | Docker 联调 |
| ☐ | `assetstore/chicken3.jpg` | — | 素材 |
| ☐ | `assetstore/little_chicken1.jpg` | — | 素材 |
| ☐ | `assetstore/little_chicken2.jpg` | — | 素材 |
| ☑ | `apps/web/package.json` | P1 | Web 依赖 |
| ☑ | `apps/web/vite.config.ts` | P1 | Vite 配置 |
| ☑ | `apps/web/tsconfig.json` | P1 | TS 配置 |
| ☑ | `apps/web/index.html` | P1 | 入口 HTML |
| ☑ | `apps/web/tailwind.config.ts` | P1 | Tailwind |
| ☑ | `apps/web/postcss.config.js` | P1 | PostCSS |
| ☑ | `apps/web/src/main.tsx` | P1 | React 挂载 |
| ☑ | `apps/web/src/App.tsx` | P1 | 路由 |
| ☑ | `apps/web/src/index.css` | P1 | 全局样式 |
| ☑ | `apps/web/src/pages/TreeHouseEntry/index.tsx` | P1 | 树屋开场 |
| ☑ | `apps/web/src/pages/PetSelection/index.tsx` | P1 | 选宠 |
| ☑ | `apps/web/src/pages/Dashboard/index.tsx` | P1 | Dashboard |
| ☑ | `apps/web/src/components/TreeHouseScene.tsx` | P1 | 树屋 SVG |
| ☑ | `apps/web/src/components/PetSprite.tsx` | P1 | 小鸟动画 |
| ☑ | `apps/web/src/components/SpeechBubble.tsx` | P1 | 气泡 |
| ☑ | `apps/web/src/components/HealthCards.tsx` | P1 | 健康卡片 |
| ☑ | `apps/web/src/store/petStore.ts` | P1 | 状态持久化 |
| ☑ | `apps/web/src/mock/healthData.ts` | P1 | Mock 健康数据 |
| ☑ | `apps/web/src/mock/petBehaviorMapping.ts` | P1 | Mock 行为映射 |
| ☐ | `apps/web/src/hooks/useHealthSnapshot.ts` | P2 | API/WebSocket Hook |
| ☐ | `apps/desktop-pet/package.json` | P2 | Electron 配置 |
| ☐ | `apps/desktop-pet/tsconfig.json` | P2 | TS 配置 |
| ☐ | `apps/desktop-pet/tsconfig.main.json` | P2 | 主进程 TS |
| ☐ | `apps/desktop-pet/src/main.ts` | P2 | 主进程 |
| ☐ | `apps/desktop-pet/src/preload.ts` | P2 | 预加载 |
| ☐ | `apps/desktop-pet/src/collector/keyMouse.ts` | P2 | 键鼠采集 |
| ☐ | `apps/desktop-pet/src/collector/decisionLoop.ts` | P2 | 决策循环 |
| ☐ | `apps/desktop-pet/src/ipc/types.ts` | P2 | IPC 类型 |
| ☐ | `apps/desktop-pet/src/overlay/index.ts` | P2 | 悬浮窗 |
| ☐ | `apps/desktop-pet/src/pet-ui/index.ts` | P2 | 宠物 UI |
| ☐ | `apps/mobile/app.json` | P2 | Expo 配置 |
| ☐ | `apps/mobile/package.json` | P2 | 移动端依赖 |
| ☐ | `apps/mobile/tsconfig.json` | P2 | TS 配置 |
| ☐ | `apps/mobile/src/App.tsx` | P2 | 根组件 |
| ☐ | `apps/mobile/src/index.ts` | P2 | 导出入口 |
| ☐ | `apps/mobile/src/auth/binding.ts` | P2 | 账号绑定 |
| ☐ | `apps/mobile/src/collector/lowFrictionSignals.ts` | P2 | 信号采集 |
| ☐ | `apps/mobile/src/permissions/index.ts` | P2 | 权限 |
| ☐ | `apps/mobile/src/sync/signalUpload.ts` | P2 | 信号上报 |
| ☐ | `apps/server/package.json` | P2 | 后端配置 |
| ☐ | `apps/server/tsconfig.json` | P2 | TS 配置 |
| ☐ | `apps/server/requirements.txt` | P2 | Python 依赖 |
| ☐ | `apps/server/src/index.ts` | P2 | Hono 入口 |
| ☐ | `apps/server/src/main.py` | P2 | FastAPI 桩 |
| ☐ | `apps/server/src/__init__.py` | P2 | Python 包 |
| ☐ | `apps/server/src/api/__init__.py` | P2 | API 包 |
| ☐ | `apps/server/src/api/mobile_signals.py` | P2 | 手机信号桩 |
| ☐ | `apps/server/src/api/web_work_sessions.py` | P2 | 工作会话桩 |
| ☐ | `apps/server/src/routes/mobileSignals.ts` | P2 | 手机信号路由 |
| ☐ | `apps/server/src/routes/workSessions.ts` | P2 | 工作会话路由 |
| ☐ | `apps/server/src/routes/petConfig.ts` | P2 | 宠物配置路由 |
| ☐ | `apps/server/src/routes/health.ts` | P2 | 健康快照路由 |
| ☐ | `apps/server/src/db/sqlite.ts` | P2 | SQLite |
| ☐ | `apps/server/src/scheduler/index.ts` | P2 | 定时任务 |
| ☐ | `apps/server/src/ws/hub.ts` | P2 | WebSocket |
| ☐ | `apps/treehouse/src/charts/README.md` | — | 遗留说明 |
| ☐ | `apps/treehouse/src/settings/README.md` | — | 遗留说明 |
| ☑ | `packages/shared-types/package.json` | P1 | 类型包配置 |
| ☑ | `packages/shared-types/tsconfig.json` | P1 | TS 配置 |
| ☑ | `packages/shared-types/src/index.ts` | P1 | 核心类型定义 |
| ☐ | `packages/decision-engine/package.json` | P2 | 决策包配置 |
| ☐ | `packages/decision-engine/tsconfig.json` | P2 | TS 配置 |
| ☐ | `packages/decision-engine/src/index.ts` | P2 | 决策逻辑 |
| ☐ | `packages/health-engine/package.json` | P2 | 健康包配置 |
| ☐ | `packages/health-engine/tsconfig.json` | P2 | TS 配置 |
| ☐ | `packages/health-engine/src/index.ts` | P2 | 健康分析 |
| ☐ | `packages/pet-engine/package.json` | P2 | 行为包配置 |
| ☐ | `packages/pet-engine/tsconfig.json` | P2 | TS 配置 |
| ☐ | `packages/pet-engine/src/index.ts` | P2 | 行为映射 |
| ☐ | `packages/llm-client/package.json` | P3 | LLM 包配置 |
| ☐ | `packages/llm-client/tsconfig.json` | P3 | TS 配置 |
| ☐ | `packages/llm-client/src/index.ts` | P3 | 导出入口 |
| ☐ | `packages/llm-client/src/types.ts` | P3 | LLM 类型 |
| ☐ | `packages/llm-client/src/client.ts` | P3 | API 客户端 |
| ☐ | `packages/llm-client/src/prompts/personalityPrompt.ts` | P3 | 性格 Prompt |

---

## MVP 验收清单（与 ☑ 文件对应）

- [ ] `yarn dev:web` 或 `npm run dev:web` 可启动
- [ ] `/` → 选宠 → `/dashboard` 全流程可走
- [ ] 选宠信息刷新后仍在（localStorage）
- [ ] Dashboard 进入后 3 秒内有第一句关怀话
- [ ] 至少 2 种性格台词可区分
- [ ] 点击小鸟有互动反馈
- [ ] mock 变化时：鸟动作 + 气泡 + HealthCards 一致

**MVP 需实现文件：25 个**（上表 ☑ 行） · **完整版骨架：63 个**（上表 ☐ 行）

---

## PR 纪律

- MVP 阶段默认只改 `apps/web/` 及 MVP 必需的 `packages/shared-types`
- 改 server / mobile / desktop-pet / 引擎包请打标签 `phase-2` 或 `phase-3`
- 演示口径：**「数据为演示；架构已预留多端」**

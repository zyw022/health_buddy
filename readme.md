# Health Buddy

无穿戴健康监测桌宠——以手机与电脑替代手环，通过被动数据采集 + 桌面宠物小鸟，提供润物细无声的健康关怀。

---

## 产品核心理念

| 传统手环 | Health Buddy |
|---|---|
| 需要额外购买穿戴设备 | 复用用户已有的手机和电脑 |
| 冷冰冰的数据仪表盘 | 有温度的宠物情绪表达 |
| 主动查看才能获得信息 | 实时、润物细无声地提醒 |
| 数据孤岛 | 多设备联动、智能仲裁 |

---

## 仓库结构（Monorepo）

```
health_buddy/
├── apps/
│   ├── web/                # Phase 1 起点：树屋 + 选宠 + Dashboard（浏览器 MVP）
│   ├── desktop-pet/        # Phase 2：Electron 悬浮窗 + 采集（stub，见 TODO(phase-2)）
│   ├── mobile/             # Phase 2：React Native 手机端（stub）
│   └── server/             # Phase 2：后端（当前 Python 桩，目标 Hono + TS）
│
├── packages/
│   ├── shared-types/       # 跨端 TypeScript 类型定义（从这里开始读）
│   ├── decision-engine/    # 多设备仲裁层（逻辑已有，Phase 2 接真实信号）
│   ├── health-engine/      # 健康分析层（stub → Phase 2/3）
│   ├── pet-engine/         # 行为映射 + 个性过滤器（stub → Phase 2/3）
│   └── llm-client/         # Phase 3 新增（尚未创建目录）
│
├── package.json            # Monorepo 根配置（yarn / npm workspaces）
└── tsconfig.base.json      # 共享 TypeScript 配置
```

> **说明：** 树屋仪表盘已合并进 `apps/web/`（`Dashboard` 页），不再单独维护 `apps/treehouse/`。

---

## MVP 范围 / 完整仓库对照表

**策略：** 仓库按完整版 Monorepo 搭建；**当前 Sprint 只交付 MVP**。下表 `[x]` = MVP 必须实现，`[ ]` = 完整版后续（Phase 2/3）或仅 stub，MVP 不开发。

### MVP 一句话

用户打开浏览器 → 树屋门开 → 选小鸟 → Dashboard 里鸟根据 **mock 数据** 说一句符合 **性格** 的话。

### 图例

| 列 | 含义 |
|----|------|
| **MVP** | `[x]` 本 Sprint 要实现并验收；`[ ]` 不实现（可保留占位文件） |
| **阶段** | P1=MVP · P2=多端数据 · P3=AI 深化 |
| **状态** | 仓库中是否已有文件/目录 |

---

### 1. 根目录与 Monorepo

| MVP | 路径 | 阶段 | 状态 | 完整版 / MVP 要实现的内容 |
|:---:|------|:----:|:----:|---------------------------|
| [x] | `package.json` | P1 | 已有 | workspaces；`dev:web` 脚本；MVP 能安装并启动 web |
| [x] | `tsconfig.base.json` | P1 | 已有 | 共享 TS 配置，供 `apps/web` 继承 |
| [ ] | `infra/`（Docker / CI） | P2+ | 未建 | 构建、部署流水线 |

---

### 2. `apps/web/` — 浏览器 MVP（唯一交付面）

| MVP | 路径 | 阶段 | 状态 | 完整版 / MVP 要实现的内容 |
|:---:|------|:----:|:----:|---------------------------|
| [x] | `apps/web/package.json` | P1 | 已有 | React、Vite、路由、Zustand 依赖 |
| [x] | `apps/web/vite.config.ts` | P1 | 已有 | 本地 dev / build |
| [x] | `apps/web/tsconfig.json` | P1 | 已有 | 类型检查 |
| [x] | `apps/web/index.html` | P1 | 已有 | 入口 HTML |
| [x] | `apps/web/tailwind.config.ts` | P1 | 已有 | 样式主题 |
| [x] | `apps/web/postcss.config.js` | P1 | 已有 | Tailwind 构建 |
| [x] | `apps/web/src/main.tsx` | P1 | 已有 | React 挂载 |
| [x] | `apps/web/src/App.tsx` | P1 | 已有 | 路由：`/` · `/select-pet` · `/dashboard` |
| [x] | `apps/web/src/index.css` | P1 | 已有 | 全局样式、宠物动画 class |
| [x] | `apps/web/src/pages/TreeHouseEntry/` | P1 | 已有 | 树屋开场、点击门进入选宠/回访跳 Dashboard |
| [x] | `apps/web/src/pages/PetSelection/` | P1 | 已有 | 四步选宠：种类/毛色性别/性格/名字 |
| [x] | `apps/web/src/pages/Dashboard/` | P1 | 已有 | 树屋主界面：鸟 + 气泡 + 健康卡片 + 刷新/互动 |
| [x] | `apps/web/src/components/TreeHouseScene.tsx` | P1 | 已有 | 坡屋顶树屋 SVG、门开动画 |
| [x] | `apps/web/src/components/PetSprite.tsx` | P1 | 已有 | 小鸟 SVG 动画：idle/yawn/stretch/happy/worried |
| [x] | `apps/web/src/components/SpeechBubble.tsx` | P1 | 已有 | 说话气泡、打字机效果 |
| [x] | `apps/web/src/components/HealthCards.tsx` | P1 | 已有 | mock 健康数据卡片展示 |
| [x] | `apps/web/src/store/petStore.ts` | P1 | 已有 | 选宠配置 + onboarding 状态；localStorage 持久化 |
| [x] | `apps/web/src/mock/healthData.ts` | P1 | 已有 | 模拟 HealthSnapshot（按时段变化） |
| [x] | `apps/web/src/mock/petBehaviorMapping.ts` | P1 | 已有 | 健康→动作→性格台词；点击互动台词 |
| [ ] | `apps/web` 接 `GET /api/health/snapshot` | P2 | 未做 | 真实健康快照 API 替换 mock |
| [ ] | `apps/web` 历史图表（7/30 天） | P3 | 未做 | 树屋仪表盘趋势图 |
| [ ] | `apps/web` 用户偏好表单 | P3 | 未做 | 兴趣、音乐风格上传 |

---

### 3. `apps/desktop-pet/` — Electron 桌宠

| MVP | 路径 | 阶段 | 状态 | 完整版 / MVP 要实现的内容 |
|:---:|------|:----:|:----:|---------------------------|
| [ ] | `apps/desktop-pet/package.json` | P2 | 已有 | Electron 依赖与构建脚本 |
| [ ] | `apps/desktop-pet/src/main.ts` | P2 | 已有 | 主进程、托盘、IPC；加载 web 构建产物 |
| [ ] | `apps/desktop-pet/src/collector/keyMouse.ts` | P2 | 已有 | uiohook-napi；KeyMouseSnapshot；observedIdle |
| [ ] | `apps/desktop-pet/src/collector/decisionLoop.ts` | P2 | 已有 | 5 分钟仲裁循环；接 decision-engine |
| [ ] | `apps/desktop-pet/src/overlay/` | P2 | 占位 | 透明悬浮窗、拖拽、双击进树屋 |
| [ ] | `apps/desktop-pet/src/pet-ui/` | P2 | 占位 | 复用 web 小鸟组件；IPC 驱动动画 |
| [ ] | `apps/desktop-pet` preload / renderer 构建 | P2 | 未建 | 安全 IPC、打包 web 资源 |

---

### 4. `apps/mobile/` — React Native / Expo

| MVP | 路径 | 阶段 | 状态 | 完整版 / MVP 要实现的内容 |
|:---:|------|:----:|:----:|---------------------------|
| [ ] | `apps/mobile/package.json` | P2 | 已有 | Expo 工程配置 |
| [ ] | `apps/mobile/app.json` 等 Expo 入口 | P2 | 未建 | 真机运行、权限引导 |
| [ ] | `apps/mobile/src/collector/lowFrictionSignals.ts` | P2 | 已有 | 亮屏、运动状态、步数增量采集 |
| [ ] | `apps/mobile/src/sync/signalUpload.ts` | P2 | 已有 | 批次上报、离线队列、JWT |
| [ ] | `apps/mobile` 扫码绑定同账号 | P2 | 未做 | 与 desktop/web 同一 userId |

---

### 5. `apps/server/` — 后端

| MVP | 路径 | 阶段 | 状态 | 完整版 / MVP 要实现的内容 |
|:---:|------|:----:|:----:|---------------------------|
| [ ] | `apps/server/package.json` | P2 | 已有 | 当前指向 Python；目标改为 Hono |
| [ ] | `apps/server/requirements.txt` | P2 | 已有 | **当前** FastAPI 桩依赖 |
| [ ] | `apps/server/src/main.py` | P2 | 已有 | **当前** FastAPI 入口（Phase 2 弃用） |
| [ ] | `apps/server/src/api/mobile_signals.py` | P2 | 已有 | **当前** 手机信号接收桩 |
| [ ] | `apps/server/src/api/web_work_sessions.py` | P2 | 已有 | **当前** 公共电脑心跳桩 |
| [ ] | `apps/server/src/index.ts`（Hono 入口） | P2 | 未建 | 替换 FastAPI |
| [ ] | `apps/server/src/routes/mobileSignals.ts` | P2 | 未建 | POST 手机信号批次 |
| [ ] | `apps/server/src/routes/workSessions.ts` | P2 | 未建 | Web 工作会话 CRUD + 心跳 |
| [ ] | `apps/server/src/routes/petConfig.ts` | P2 | 未建 | 宠物配置 GET/PUT |
| [ ] | `apps/server/src/routes/health.ts` | P2 | 未建 | 健康快照 / 日报查询 |
| [ ] | `apps/server/src/db/sqlite.ts` | P2 | 未建 | better-sqlite3 持久化 |
| [ ] | `apps/server` WebSocket 推送 | P2 | 未建 | 实时 health/trigger 到客户端 |

---

### 6. `packages/` — 共享逻辑

| MVP | 路径 | 阶段 | 状态 | 完整版 / MVP 要实现的内容 |
|:---:|------|:----:|:----:|---------------------------|
| [x] | `packages/shared-types/package.json` | P1 | 已有 | workspace 包配置 |
| [x] | `packages/shared-types/src/index.ts` | P1 | 已有 | **MVP 使用：** `PetConfig` · `HealthSnapshot` · `PetPersonality` 等；与 web mock 字段一致 |
| [ ] | `packages/shared-types` 扩展决策/采集类型 | P2 | 部分已有 | ActivityDecision · SignalQuality 等（MVP 不消费） |
| [ ] | `packages/decision-engine/package.json` | P2 | 已有 | — |
| [ ] | `packages/decision-engine/src/index.ts` | P2 | 已有 | 多状态打分；Phase 2 接真实 SignalWindow |
| [ ] | `packages/health-engine/package.json` | P2 | 已有 | — |
| [ ] | `packages/health-engine/src/index.ts` | P2 | 已有 | ActivityDecision → HealthSnapshot |
| [ ] | `packages/pet-engine/package.json` | P2 | 已有 | — |
| [ ] | `packages/pet-engine/src/index.ts` | P2 | 已有 | HealthSnapshot → PetTrigger；Phase 2 替换 web mock 映射 |
| [ ] | `packages/llm-client/` | P3 | 未建 | DeepSeek/OpenAI 封装 |
| [ ] | `packages/llm-client/prompts/personalityPrompt.ts` | P3 | 未建 | 性格 System Prompt |

> MVP 不实现 `decision-engine` / `health-engine` / `pet-engine` 的运行时联调；由 `apps/web/src/mock/*` 代替 L2→L4。

---

### 7. MVP 整体验收（与上表 `[x]` 项对应）

- [ ] `yarn dev:web` 或 `npm run dev:web` 可启动
- [ ] `/` → 选宠 → `/dashboard` 全流程可走
- [ ] 选宠信息刷新后仍在（localStorage）
- [ ] Dashboard 进入后 3 秒内有第一句关怀话
- [ ] 至少 2 种性格台词可区分
- [ ] 点击小鸟有互动反馈
- [ ] mock 变化时：鸟动作 + 气泡 + HealthCards 一致

**MVP 文件计数（需实现）：** 根目录 2 + `apps/web` 18 ≈ **20 项**（上表 `[x]` 行）。其余 `[ ]` 项完整版再补。

### PR 纪律（防跑偏）

- **MVP 阶段默认只改** `apps/web/` 及 MVP 必需的 `shared-types` 字段
- 改 `server` / `mobile` / `desktop-pet` / 引擎包请打标签 `phase-2` 或 `phase-3`
- 演示口径：**「数据为演示；架构已预留多端」**

### 代码中的 TODO 约定

| 标记 | 含义 |
|------|------|
| `TODO(phase-1)` | 当前 MVP Sprint 应完成 |
| `TODO(phase-2)` | 多端数据、Hono 后端、Electron、真实引擎联调 |
| `TODO(phase-3)` | LLM、rPPG、历史图表、用户偏好深度个性化 |

---

## 快速开始

### 环境要求

- Node.js >= 20
- Yarn >= 1.22 或 npm（workspaces）
- Python >= 3.11（**仅 Phase 2+ 启动 server 时需要**）

### 安装依赖

```bash
yarn install
# 或：npm install
```

### 启动 Web MVP（Phase 1 首选）

```bash
yarn dev:web
# 或：npm run dev:web
```

浏览器打开终端提示的本地地址（通常 `http://localhost:5173`）。

### Phase 2+ 可选启动

```bash
yarn dev:desktop   # Electron 桌宠（stub，需 Phase 2 完善）
yarn dev:server    # Python FastAPI 桩（Phase 2 迁移为 Hono）

### MVP Definition of Done

- [ ] `yarn dev:web` 或 `npm run dev:web` 可启动
- [ ] `/` → 选宠 → `/dashboard` 全流程可走
- [ ] 选宠信息刷新后仍在（localStorage）
- [ ] Dashboard 进入后 3 秒内有第一句关怀话
- [ ] 至少 2 种性格台词可区分
- [ ] 点击小鸟有互动反馈

### PR 纪律（防跑偏）

- **MVP 阶段默认只改** `apps/web/` 及 MVP 必需的 `shared-types` 字段
- 改 `server` / `mobile` / `desktop-pet` / 引擎包请打标签 `phase-2` 或 `phase-3`
- 演示口径：**「数据为演示；架构已预留多端」**

### 代码中的 TODO 约定

| 标记 | 含义 |
|------|------|
| `TODO(phase-1)` | 当前 MVP Sprint 应完成 |
| `TODO(phase-2)` | 多端数据、Hono 后端、Electron、真实引擎联调 |
| `TODO(phase-3)` | LLM、rPPG、历史图表、用户偏好深度个性化 |

---

## 快速开始

### 环境要求

- Node.js >= 20
- Yarn >= 1.22 或 npm（workspaces）
- Python >= 3.11（**仅 Phase 2+ 启动 server 时需要**）

### 安装依赖

```bash
yarn install
# 或：npm install
```

### 启动 Web MVP（Phase 1 首选）

```bash
yarn dev:web
# 或：npm run dev:web
```

浏览器打开终端提示的本地地址（通常 `http://localhost:5173`）。

### Phase 2+ 可选启动

```bash
yarn dev:desktop   # Electron 桌宠（stub，需 Phase 2 完善）
yarn dev:server    # Python FastAPI 桩（Phase 2 迁移为 Hono）
```

---

## 系统分层与数据流

```
[手机采集]  [桌面采集]
     \          /
      \        /
   [决策仲裁层]  ← packages/decision-engine
         |
   [健康分析层]  ← packages/health-engine  (AI 接入点)
         |
   [行为映射层]  ← packages/pet-engine
      /      \
[宠物 UI]  [树屋界面]
```

每 5 分钟运行一次仲裁循环：
1. `collector/keyMouse.ts` 采集键鼠活动快照
2. `collector/decisionLoop.ts` 汇总所有信号，调用 `decision-engine`
3. `decision-engine` 输出 `ActivityDecision`（含置信度、观测覆盖率和证据）
4. `health-engine` 聚合为 `HealthSnapshot`
5. `pet-engine` 将快照映射为 `PetTrigger` 列表
6. 主进程将触发事件推送给渲染进程，驱动小鸟动画与对话

---

## 数据采集与决策原则

决策层必须区分三种情况：

- `observed_positive`：明确观测到活动，例如本机键鼠有输入、手机亮屏、步数增加。
- `observed_zero`：采集器在线且明确观测到 0，例如桌面解锁但本分钟无键鼠活动。
- `missing`：信号缺失，例如这台电脑没装客户端、手机端未授权步数、网络断开。

不能把 `missing` 当成“用户没有活动”。当观测覆盖率不足时，`decision-engine` 应输出 `unknown` 或低置信度结果，宠物只做陪伴式反馈，不进行强提醒。

### 权限分层

**默认开启（低敏）：**

- 桌面 active/idle、锁屏/解锁、每分钟键鼠活动强度
- 手机亮屏/锁屏事件
- 步数增量
- 手机运动状态（静止、步行、跑步、交通工具）
- 同 WiFi / 蓝牙近距信号
- 设备心跳

**用户主动开启（增强精度）：**

- Android `UsageStatsManager` 应用使用统计
- iOS Screen Time / Device Activity
- rPPG 摄像头心率
- 浏览器扩展或网页版工作会话

**默认禁止采集：**

| 模块 | 路径 | MVP | 建议方向 |
|---|---|:---:|---|
| Web / 树屋 / 选宠 | `apps/web/` | 是 | 前端 / 宠物交互 |
| 桌面宠物 UI | `apps/desktop-pet/src/pet-ui/` | 否 | 前端 / 动画（Phase 2） |
| 桌面悬浮窗 | `apps/desktop-pet/src/overlay/` | 否 | Electron（Phase 2） |
| 手机端采集 | `apps/mobile/` | 否 | 移动端（Phase 2） |
| 后端 API | `apps/server/` | 否 | 后端（Phase 2 迁 Hono） |
| 仲裁逻辑 | `packages/decision-engine/` | 否 | 算法（Phase 2 联调） |
| 健康分析 | `packages/health-engine/` | 否 | 算法（Phase 2/3） |
| 行为映射 | `packages/pet-engine/` | 否 | 算法（Phase 2/3） |
- 高置信度：直接提醒，例如“坐太久了，站起来活动一下吧”。
- 中置信度：询问式提醒，例如“你是不是一直在忙？要不要休息一下？”。
- 低置信度：不打断，只做陪伴，例如小鸟在角落安静待着。
- `unknown`：不把该时间段纳入精确久坐统计，等待后续信号回填。

---

## 公共电脑场景

公共电脑不要求安装桌面客户端。Health Buddy 使用“手机作为身份锚点，电脑端作为增强信号”的设计。
**Phase 1 — Web MVP（当前 Sprint）：**

- [ ] `apps/web/` — 树屋开场 + 选宠 + Dashboard 闭环（mock 数据）
- [ ] `apps/web/src/mock/` — 健康→动作→台词映射规则
- [ ] `apps/web/` — `yarn dev:web` 一键启动 + 静态部署（可选）

**Phase 2 — 多端数据（见各文件 `TODO(phase-2)`）：**

- [ ] `apps/server/` — Python → **Hono + TypeScript** + SQLite
- [ ] `apps/mobile/` — 步数、亮屏、运动状态真实采集与上报
- [ ] `apps/desktop-pet/` — Electron 悬浮窗 + `uiohook-napi` + `powerMonitor`
- [ ] `packages/decision-engine/` — 接入真实桌面/手机/Web 会话信号
- [ ] `packages/health-engine/` / `pet-engine/` — 替换 web mock 映射
- [ ] `apps/web/Dashboard` — 接真实 `HealthSnapshot` API

**Phase 3 — AI 深化（见各文件 `TODO(phase-3)`）：**

- [ ] `packages/llm-client/` — DeepSeek / OpenAI 封装
- [ ] `packages/health-engine/` — LLM 生成 `aiSummary`
- [ ] `packages/pet-engine/` — LLM 文案层 + 置信度询问式提醒
- [ ] `apps/web/Dashboard` — 7/30 天历史图表、用户偏好上传
网页版工作会话只发送心跳，不采集网页内容、键盘内容、截图或浏览历史。它的作用只是告诉系统“用户主动确认自己正在电脑前”。

对应后端接口：

- `POST /api/work-sessions`：开始公共电脑工作会话
- `POST /api/work-sessions/heartbeat`：刷新会话心跳
- `POST /api/work-sessions/end`：结束会话
- `GET /api/work-sessions/{user_id}/active`：供决策层读取活跃会话

---

## 贡献指南

### 各模块负责方

| 模块 | 路径 | 建议方向 |
|---|---|---|
| 桌面宠物 UI | `apps/desktop-pet/src/pet-ui/` | 前端 / 动画 |
| 树屋界面 | `apps/treehouse/` | 前端 |
| 手机端采集 | `apps/mobile/` | 移动端 |
| Web MVP | React 18, Vite, Tailwind, Framer Motion, Zustand |
| 后端（目标） | Hono, better-sqlite3, Zod, WebSocket（当前桩：FastAPI） |
| 仲裁逻辑 | `packages/decision-engine/` | 算法 |
| 健康分析 AI | `packages/health-engine/` | AI / 算法 |
| 行为映射 | `packages/pet-engine/` | 算法 |

### 开始一个新功能

1. 从 `packages/shared-types/src/index.ts` 读懂涉及的数据类型
2. 找到对应模块的 `src/index.ts` 骨架，查看 `TODO` 注释
3. 在自己的分支上开发，PR 合并前确保 `yarn typecheck:all` 通过
4. 如需新增跨端类型，先在 `shared-types` 中添加，再提 PR

### TODO 导航（按优先级）

**Phase 1 核心任务：**

- [ ] `apps/desktop-pet/src/collector/keyMouse.ts` — 接入 `uiohook-napi` 全局键鼠钩子
- [ ] `apps/desktop-pet/src/collector/decisionLoop.ts` — 补全信号聚合（手机事件、微信步数）
- [ ] `apps/desktop-pet/src/pet-ui/` — 小鸟基础动画组件（Lottie / PixiJS）
- [ ] `apps/desktop-pet/src/overlay/` — 透明悬浮窗拖拽与双击进入树屋
- [ ] `apps/treehouse/` — 今日健康数据展示界面
- [ ] `apps/server/` — FastAPI 骨架 + SQLite/PostgreSQL 接入

**Phase 2 扩展任务：**

- [ ] `apps/mobile/` — React Native 手机端步数与亮屏事件上报
- [ ] `packages/health-engine/` — rPPG 摄像头心率结果接入
- [ ] `packages/pet-engine/` — 接入 LLM API，替换固定模板对话
- [ ] `apps/desktop-pet/` — 微信多端在线状态检测（WebSocket 心跳）

**Phase 3 AI 深化：**

- [ ] `packages/health-engine/` — 替换规则引擎为 GPT-4o 多模态分析
- [ ] `packages/pet-engine/` — LoRA 个性微调接口
- [ ] `apps/treehouse/` — 完整历史图表（周/月视图）

---

## 隐私设计原则

- 键鼠采集：**仅统计次数与移动距离，不记录任何具体按键内容**
- rPPG 心率：**纯本地推断，视频帧不上传，处理完即丢弃**
- 公共电脑：**默认不要求安装客户端，可用网页版心跳作为自愿增强信号**
- 决策层：**低观测覆盖率时输出 unknown，不把缺失数据当成用户无活动**
- 所有本地数据加密存储，上报至服务器需用户主动授权
- 用户可随时在树屋界面关闭任意采集模块

---

## 技术选型速查

| 层 | 主要技术 |
|---|---|
| 桌面端 | Electron, React, TypeScript, uiohook-napi |
| 移动端 | React Native, Expo, HealthKit / Google Fit |
| 后端 | FastAPI, PostgreSQL, Redis, WebSocket |
| 仲裁逻辑 | `packages/decision-engine/` | 算法 |
| 健康分析 AI | `packages/health-engine/` | AI / 算法 |
| 行为映射 | `packages/pet-engine/` | 算法 |

### 开始一个新功能

1. 从 `packages/shared-types/src/index.ts` 读懂涉及的数据类型
2. 找到对应模块的 `src/index.ts` 骨架，查看 `TODO` 注释
3. 在自己的分支上开发，PR 合并前确保 `yarn typecheck:all` 通过
4. 如需新增跨端类型，先在 `shared-types` 中添加，再提 PR

### TODO 导航（按优先级）

**Phase 1 核心任务：**

- [ ] `apps/desktop-pet/src/collector/keyMouse.ts` — 接入 `uiohook-napi` 全局键鼠钩子
- [ ] `apps/desktop-pet/src/collector/decisionLoop.ts` — 补全信号聚合（手机事件、微信步数）
- [ ] `apps/desktop-pet/src/pet-ui/` — 小鸟基础动画组件（Lottie / PixiJS）
- [ ] `apps/desktop-pet/src/overlay/` — 透明悬浮窗拖拽与双击进入树屋
- [ ] `apps/treehouse/` — 今日健康数据展示界面
- [ ] `apps/server/` — FastAPI 骨架 + SQLite/PostgreSQL 接入

**Phase 2 扩展任务：**

- [ ] `apps/mobile/` — React Native 手机端步数与亮屏事件上报
- [ ] `packages/health-engine/` — rPPG 摄像头心率结果接入
- [ ] `packages/pet-engine/` — 接入 LLM API，替换固定模板对话
- [ ] `apps/desktop-pet/` — 微信多端在线状态检测（WebSocket 心跳）

**Phase 3 AI 深化：**

- [ ] `packages/health-engine/` — 替换规则引擎为 GPT-4o 多模态分析
- [ ] `packages/pet-engine/` — LoRA 个性微调接口
- [ ] `apps/treehouse/` — 完整历史图表（周/月视图）

---

## 隐私设计原则

- 键鼠采集：**仅统计次数与移动距离，不记录任何具体按键内容**
- rPPG 心率：**纯本地推断，视频帧不上传，处理完即丢弃**
- 公共电脑：**默认不要求安装客户端，可用网页版心跳作为自愿增强信号**
- 决策层：**低观测覆盖率时输出 unknown，不把缺失数据当成用户无活动**
- 所有本地数据加密存储，上报至服务器需用户主动授权
- 用户可随时在树屋界面关闭任意采集模块

---

## 技术选型速查

| 层 | 主要技术 |
|---|---|
| 桌面端 | Electron, React, TypeScript, uiohook-napi |
| 移动端 | React Native, Expo, HealthKit / Google Fit |
| 后端 | FastAPI, PostgreSQL, Redis, WebSocket |
| 心率检测 | OpenCV rPPG (CHROM/POS), MediaPipe Face Mesh |
| AI 分析 | GPT-4o multimodal, scikit-learn |
| 宠物对话 | LLM System Prompt, LoRA, edge-tts / CosyVoice |
| 动画 | Lottie, PixiJS, Spine2D |

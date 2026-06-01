# 树屋系统架构文档
## Treehouse System Architecture — Health Companion

---

## 1. 系统总览

```
┌─────────────────────────────────────────────────────────────────┐
│                        🖥️ Electron Shell                        │
│                                                                  │
│  ┌──────────────────────┐      ┌──────────────────────────┐     │
│  │   🐤 桌宠窗口          │      │   🏠 树屋主窗口            │     │
│  │   (Pet Window)        │      │   (Treehouse Window)      │     │
│  │                       │      │                           │     │
│  │  • 200×200 frameless  │ ──── │  • 800×700 可缩放         │     │
│  │  • always-on-top      │ IPC  │  • 树屋外形可视化         │     │
│  │  • transparent bg     │      │  • 6 数据卡片 + 心情      │     │
│  │  • 待机动画 + 交互    │      │  • 小鸡助手面板           │     │
│  └──────────────────────┘      └──────────────────────────┘     │
│           │                               │                      │
│           └───────────┬───────────────────┘                      │
│                       │                                          │
│              ┌────────┴────────┐                                 │
│              │  preload.js      │                                 │
│              │  IPC Bridge      │                                 │
│              └────────┬────────┘                                 │
│                       │                                          │
│              ┌────────┴────────┐                                 │
│              │   main.js        │                                 │
│              │   Window Manager │                                 │
│              └────────┬────────┘                                 │
└───────────────────────┼──────────────────────────────────────────┘
                        │
          ┌─────────────┼─────────────┐
          │             │             │
    ┌─────┴─────┐ ┌────┴────┐ ┌──────┴──────┐
    │ REST API   │ │ WebSocket│ │ Local Store │
    │ (Express)  │ │ (WS)     │ │ (SQLite)   │
    └────────────┘ └──────────┘ └─────────────┘
```

### 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 外壳 | Electron 33.x | 桌面应用框架 |
| 渲染 | HTML5 + CSS3 + Vanilla JS | 树屋界面 + 桌宠动画 |
| 进程通信 | Electron IPC (contextBridge) | 主进程 ↔ 渲染进程 |
| 后端 API | Node.js + Express (预留) | RESTful 健康数据接口 |
| 实时推送 | WebSocket (预留) | 健康数据实时更新 |
| 本地存储 | electron-store / SQLite (预留) | 离线数据持久化 |

---

## 2. 前端组件树

```
App (Electron)
├── PetWindow (桌宠窗口)
│   └── pet.html
│       ├── .pet-character        — 角色图片动画
│       ├── .pet-bubble           — 简短提示气泡
│       └── .pet-context-menu     — 右键菜单
│
├── TreehouseWindow (树屋主窗口)
│   └── treehouse.html
│       ├── .canopy-layer         — 树冠装饰层 (CSS 伪元素)
│       ├── .tree-trunk           — 树干 + 树洞(小鸡)
│       ├── .treehouse-body       — 木屋主体
│       │   ├── .house-header     — Header (返回 + 标题 + 设置)
│       │   ├── .house-windows    — 数据卡片网格 (6 窗户)
│       │   │   ├── StepsCard     — 👟 步数 (进度条)
│       │   │   ├── SleepCard     — 🌙 睡眠 (阶段条+星级)
│       │   │   ├── WorkStatsCard — 💻 工作统计 (趋势图)
│       │   │   ├── ScreenTimeCard— 📱 屏幕时间 (环形图)
│       │   │   ├── HeartRateCard — ❤️ 心率 (ECG线)
│       │   │   └── WaterCard     — 💧 饮水 (水滴计数)
│       │   └── MoodInput         — 😊 心情记录 (表情+标签+笔记)
│       └── .chick-companion      — 小鸡助手气泡消息
│
└── MainProcess (main.js)
    ├── createPetWindow()         — 创建桌宠窗口
    ├── createTreehouseWindow()   — 创建树屋窗口
    ├── ipcHandlers               — IPC 通道注册
    └── healthDataService         — 数据服务 (预留)
```

---

## 3. 数据流设计

```
┌─────────────────────────────────────────────────────────────────┐
│                        数据采集层                                │
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ 系统API   │ │ 硬件传感器 │ │ 手动输入  │ │ 第三方集成│           │
│  │(屏幕时间) │ │(心率/步数)│ │(心情/饮水)│ │(HealthKit)│           │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘           │
│       │            │            │            │                   │
│       └────────────┴────────────┴────────────┘                   │
│                         │                                        │
│                  ┌──────┴──────┐                                 │
│                  │  Data Hub    │  ← 数据聚合 & 标准化           │
│                  └──────┬──────┘                                 │
└─────────────────────────┼───────────────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────────────┐
│                        数据管理层                                │
│                                                                  │
│  ┌──────────────────────┴──────────────────────┐                │
│  │            HealthData State                  │                │
│  │  {                                           │                │
│  │    steps:     { value, goal, history[] }     │                │
│  │    sleep:     { duration, quality, stages }  │                │
│  │    screenTime:{ total, breakdown[] }         │                │
│  │    workStats: { keystrokes, clicks, time }   │                │
│  │    heartRate: { value, status, history[] }   │                │
│  │    water:     { current, goal }              │                │
│  │    mood:      { level, tags[], note }        │                │
│  │  }                                           │                │
│  └──────────────────────┬──────────────────────┘                │
│                         │                                        │
│         ┌───────────────┼───────────────┐                       │
│         │               │               │                        │
│  ┌──────┴──────┐ ┌──────┴──────┐ ┌──────┴──────┐                │
│  │ Local Cache  │ │ IPC Bridge  │ │ API Client  │                │
│  │ (localStorage│ │ (preload.js)│ │ (fetch/WS)  │                │
│  └──────────────┘ └──────────────┘ └──────────────┘               │
└─────────────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────────────┐
│                        渲染层                                     │
│                                                                  │
│  ┌──────────────────────┴──────────────────────┐                │
│  │           UI Components                      │                │
│  │                                              │                │
│  │  data → renderCards() → DOM update           │                │
│  │  event → handleAction() → state update → UI  │                │
│  └──────────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

### 数据更新触发机制

```
用户操作          自动采集            后端推送
   │                 │                   │
   ├─ 点击喝水按钮    ├─ 定时器轮询       ├─ WebSocket 消息
   ├─ 记录心情       ├─ 系统事件监听      ├─ 步数更新通知
   ├─ 修改设置       └─ 传感器回调        └─ 睡眠数据同步
   │                 │                   │
   └─────────────────┴───────────────────┘
                     │
              renderUpdate()
                     │
          ┌──────────┼──────────┐
          │          │          │
    卡片刷新    气泡更新    桌宠动画
```

---

## 4. 后端 API 接口规范

### 4.1 RESTful API

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|-------------|----------|
| GET | `/api/health/summary` | 获取当日健康摘要 | — | `HealthData` |
| GET | `/api/health/steps` | 步数历史 | `?days=7` | `{ history: StepRecord[] }` |
| GET | `/api/health/sleep` | 睡眠记录 | `?days=7` | `{ history: SleepRecord[] }` |
| GET | `/api/health/heartrate` | 心率历史 | `?range=24h` | `{ history: HRRecord[] }` |
| POST | `/api/health/water` | 记录饮水 | `{ cups: number }` | `{ current, goal }` |
| POST | `/api/health/mood` | 记录心情 | `{ level, tags[], note? }` | `{ id, timestamp }` |
| PUT | `/api/settings/goals` | 更新目标 | `{ steps?, water?, sleep? }` | `{ updated }` |

### 4.2 数据模型 (TypeScript)

```typescript
interface HealthData {
  steps: {
    value: number;       // 当前步数
    goal: number;        // 目标步数
    percent: number;     // 完成百分比
  };
  sleep: {
    duration: string;    // "7h 30m"
    minutes: number;     // 450
    quality: number;     // 1-5 星级
    stages: {
      deep: number;      // 深度睡眠分钟
      light: number;     // 浅度睡眠分钟
      rem: number;       // REM 分钟
    };
    bedTime: string;     // "23:30"
    wakeTime: string;    // "07:00"
  };
  screenTime: {
    total: string;       // "4h23m"
    totalMinutes: number;
    change: number;      // 较昨日变化百分比
    breakdown: {
      work: string;      // "2h"
      social: string;    // "1h"
      entertainment: string; // "38m"
    };
  };
  workStats: {
    keystrokes: number;
    mouseClicks: number;
    fileOps: number;
    activeTime: string;
    hourlyActivity: number[]; // 12小时活动趋势
  };
  heartRate: {
    value: number;       // bpm
    status: 'normal' | 'elevated' | 'high';
    restingHR: number;
    history: { time: string; value: number }[];
  };
  water: {
    current: number;     // 当前杯数
    goal: number;        // 目标杯数
    mlPerCup: number;    // 250
  };
  mood?: {
    level: number;       // 1-5
    label: string;       // "开心" | "良好" | ...
    tags: string[];
    note?: string;
    timestamp: string;
  };
}
```

### 4.3 WebSocket 事件

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `health:update` | Server→Client | `{ metric, value }` | 实时健康数据推送 |
| `pet:message` | Server→Client | `{ text, type }` | AI 助手消息推送 |
| `mood:recorded` | Client→Server | `MoodData` | 心情记录通知 |
| `water:update` | Client→Server | `{ cups }` | 饮水更新通知 |

---

## 5. 用户交互流程

### 5.1 主交互流程图

```
                    ┌─────────────┐
                    │  🖥️ 系统桌面  │
                    └──────┬──────┘
                           │
                    ┌──────┴──────┐
                    │ 🐤 桌宠待机  │ ← 初始状态
                    │ (Pet Idle)  │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │ 双击宠物    │ 右键菜单    │
              └────────────┼────────────┘
                           │
                    ┌──────┴──────┐
                    │ 🏠 进入树屋  │ ← 窗口切换 (300ms)
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────┴─────┐ ┌───┴────┐ ┌────┴─────┐
        │ 📊 查看数据 │ │🐤 助手 │ │ ⚡快捷操作│
        │  卡片区域  │ │  面板  │ │  按钮    │
        └─────┬─────┘ └───┬────┘ └────┬─────┘
              │            │            │
              └────────────┼────────────┘
                           │
                    ┌──────┴──────┐
                    │ 😊 记录心情  │
                    └──────┬──────┘
                           │
                    ┌──────┴──────┐
                    │ ✅ 数据提交  │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────┴─────┐ ┌───┴────┐ ┌────┴─────┐
        │ 继续浏览   │ │← 返回  │ │ ⚙️ 设置  │
        │            │ │  桌面  │ │          │
        └─────┬─────┘ └───┬────┘ └────┬─────┘
              │            │            │
              └────────────┼────────────┘
                           │
                    ┌──────┴──────┐
                    │ 🐤 桌宠待机  │ ← 返回桌面
                    └─────────────┘
```

### 5.2 数据卡片交互细节

```
┌─────────────────────────────────────────┐
│  [卡片常态]                              │
│  • 2列网格排列                          │
│  • 进入动画: 逐卡延迟50ms淡入上移        │
│  • 悬停: ↑2px + 阴影加深               │
│  • 窗户样式: 木质边框 + 内发光           │
├─────────────────────────────────────────┤
│  [点击卡片]                              │
│  • 弹出 Modal 详情                      │
│  • 显示该指标的历史趋势图                 │
│  • 提供快捷操作按钮                      │
│  • 小鸡气泡给出对应建议                   │
├─────────────────────────────────────────┤
│  [饮水卡片 — 特殊交互]                   │
│  • 点击 +1杯 / +2杯 按钮                │
│  • 水滴图标实时更新（实心↔空心）         │
│  • 达到目标 → 🎉 庆祝动画 + 气泡祝贺    │
├─────────────────────────────────────────┤
│  [心情记录 — 特殊交互]                   │
│  • 5 级表情选择（圆形按钮组）            │
│  • 6 预设标签（多选）                    │
│  • 文本笔记输入                          │
│  • 提交 → Toast 反馈 + 气泡更新         │
└─────────────────────────────────────────┘
```

---

## 6. 前后端集成点

### 6.1 Electron IPC 通道

```
┌─────────────────────────────────────────────────────┐
│                   main.js (主进程)                    │
│                                                      │
│  ipcMain.handle('get-health-data', async () => {     │
│    // 从本地缓存或 API 获取健康数据                    │
│    return healthDataService.getSummary();            │
│  });                                                 │
│                                                      │
│  ipcMain.handle('open-treehouse', () => {            │
│    createTreehouseWindow();                          │
│    petWindow.hide();                                 │
│  });                                                 │
│                                                      │
│  ipcMain.handle('close-treehouse', () => {           │
│    treehouseWindow.close();                          │
│    petWindow.show();                                 │
│  });                                                 │
│                                                      │
│  ipcMain.on('update-pet-state', (event, state) => {  │
│    petWindow.webContents.send('pet-state', state);   │
│  });                                                 │
└──────────────────────┬──────────────────────────────┘
                       │ contextBridge
┌──────────────────────┴──────────────────────────────┐
│                  preload.js (桥接层)                  │
│                                                      │
│  contextBridge.exposeInMainWorld('electronAPI', {    │
│    getHealthData: () => ipcRenderer.invoke(...),     │
│    openTreehouse: () => ipcRenderer.invoke(...),     │
│    closeTreehouse: () => ipcRenderer.invoke(...),    │
│    onPetState: (cb) => ipcRenderer.on(..., cb),      │
│  });                                                 │
└──────────────────────────────────────────────────────┘
```

### 6.2 后端 API 调用点

```
渲染进程 (treehouse.html / pet.html)
    │
    ├── window.electronAPI.getHealthData()
    │   └── → ipcRenderer.invoke → main.js
    │       └── → fetch('/api/health/summary')  [预留]
    │
    ├── fetch('/api/health/water', { method: 'POST', body: { cups: 1 } })
    │   └── → Express Router → DataService → DB
    │
    └── ws.send({ event: 'mood:recorded', data: {...} })
        └── → WebSocket Server → broadcast to subscribers
```

---

## 7. 窗口管理策略

### 7.1 窗口定义

| 窗口 | 尺寸 | 属性 | 用途 |
|------|------|------|------|
| PetWindow | 200×200 | frameless, transparent, always-on-top, skip-taskbar | 桌宠动画 |
| TreehouseWindow | 800×700 | resizable, minWidth 375, showInTaskbar | 数据主界面 |

### 7.2 窗口生命周期

```
应用启动
    │
    ├── main.js: app.whenReady()
    │
    ├── createPetWindow()
    │   ├── 位置: 屏幕右下角 (x: screenWidth-220, y: screenHeight-250)
    │   ├── 加载: pet.html
    │   └── 显示: 默认可见
    │
    └── [树屋窗口按需创建]
        │
        ├── 触发: 桌宠双击 / 右键菜单
        ├── createTreehouseWindow()
        │   ├── 位置: 屏幕居中
        │   ├── 加载: treehouse.html
        │   └── 桌宠窗口隐藏
        │
        ├── 关闭树屋 → 树屋窗口关闭, 桌宠窗口显示
        └── 退出应用 → app.quit()
```

### 7.3 通信时序

```
PetWindow                    MainProcess              TreehouseWindow
   │                             │                         │
   │ ──双击事件─────────────────→ │                         │
   │                             │ ──创建窗口─────────────→ │
   │ ←──隐藏窗口────────────────  │                         │
   │                             │ ←──加载完成────────────  │
   │                             │ ──发送健康数据─────────→ │
   │                             │                         │
   │                             │ ←──返回按钮点击────────  │
   │ ←──显示窗口────────────────  │                         │
   │                             │ ──关闭窗口─────────────→ │
```

---

## 8. 目录结构

```
health_buddy/
├── main.js                      # Electron 主进程
├── preload.js                   # IPC 预加载脚本
├── package.json                 # 项目配置
├── treehouse.html               # 树屋主界面 (树屋外形)
├── pet.html                     # 桌宠独立窗口
├── styles/                      # (预留) 独立样式文件
├── scripts/                     # (预留) 独立脚本文件
├── assetstore/                  # 图片资源
│   ├── chicken3.jpg
│   ├── little_chicken1.jpg
│   └── little_chicken2.jpg
├── TREEHOUSE_ARCHITECTURE.md    # 本文档
├── 树屋界面设计规范.md           # 设计规范
└── readme.md
```

---

**文档版本**: v1.0
**创建日期**: 2026-06-01
**关联文档**: 树屋界面设计规范.md

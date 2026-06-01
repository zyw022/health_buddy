# Health Buddy — 桌面宠物项目架构文档

> 版本：v0.2 · 更新日期：2026-06-02  
> 基于 AI Health Companion Pipeline 规划图重构。  
> 本文档是唯一权威参考，所有模块实现须对齐此架构。

---

## 一、核心定位与系统全貌

**Health Buddy** 是一款 Windows 桌面宠物应用，由三个角色协作驱动：

```
成员1：数据搜集&分析                成员3：宠物动作制作
  ① 多源数据采集                      ⑥ 状态机 × 序列帧动画
  ② 数据处理&特征提取                  动作表现形式（表情/肢体/特效）
  ③ AI健康状态分析（4维度评分）
  ④ 输出健康状态 → 宠物大脑
         ↓
⑤ PET RESPONSE ENGINE（核心）
  ├─ ① 助手功能（打开文件/提醒/播放音乐）
  ├─ ② 互动功能（情感动作：卖萌/伸懒腰/开心跳跳）
  ├─ ③ 聊天功能（AI对话）
  ├─ ④ 提示功能（健康干预：久坐/喝水/深呼吸）
  └─ ⑤ 调教性格（4种陪伴风格）
         ↓
  宠物决策中枢（Pet Brain）
  健康状态 × 性格风格 → 动作意图 + 对话内容 + 系统指令
         ↓
成员2：宠物反馈&交互（用户看到的一切）
         ↓
  ⑦ 用户行为改变 → ⑧ 健康改善 → ⑨ 数据回流&持续学习
```

---

## 二、技术栈

| 层 | 技术 | 说明 |
|---|---|---|
| 桌面容器 | Electron 28+ | 无边框透明窗口、系统托盘、全局快捷键、IPC |
| 渲染框架 | React 18 + TypeScript | 全部 UI 逻辑 |
| 构建工具 | electron-vite 2+ | 统一构建主进程 + 渲染进程，`publicDir` 指向 `assetstore/` |
| 样式 | Tailwind CSS 3 | 工具类样式 |
| 动画过渡 | Framer Motion | 页面切换、气泡弹出、树屋淡入淡出 |
| 全局状态 | Zustand + persist | 宠物配置 + 健康快照，持久化到 localStorage |
| 序列帧动画 | Canvas + rAF | 小鸟动作帧动画（7组、41帧 PNG） |
| AI 对话（Phase 2） | OpenAI / 本地 LLM | 聊天功能，Phase 1 用规则库占位 |

> **不引入（Phase 1）**：后端服务器、移动端、monorepo、Python 运行时、数据库

---

## 三、完整目录结构

```
health-buddy/                              ← 项目根目录
│
├── ARCHITECTURE.md                        ← 本文件
├── package.json                           # root 包：electron-vite + scripts
├── electron-builder.config.ts             # 打包配置（NSIS 安装包、图标）
├── tsconfig.json                          # TypeScript 根配置（paths 别名）
├── vite.config.ts                         # 渲染进程 Vite 配置
│                                          #   publicDir: 'assetstore'
│                                          #   （让 assetstore/ 内容以 / 路径访问）
│
├── assetstore/                            ← 所有静态资产（取代 public/）
│   ├── treehouse/
│   │   └── treehouseorigin.jpg            # 启动页树屋背景图（1.3 MB）
│   │
│   ├── pets/
│   │   └── birds/
│   │       └── gentle/                    # 精灵图（Sprite Sheet）× 4张
│   │           ├── usual.png              #   Sheet A — 待机/开心状态
│   │           ├── chat.png               #   Sheet B — 聊天/对话状态
│   │           ├── tired.png              #   Sheet C — 疲惫/睡觉状态
│   │           └── prompt.png             #   Sheet D — 提示/压力状态
│   │                                      #
│   │                                      #   ── 统一切分规则 ──
│   │                                      #   每张图均为等宽水平帧序列：
│   │                                      #     frameWidth  = image.naturalWidth / cols
│   │                                      #     frameHeight = image.naturalHeight
│   │                                      #   Canvas 绘制第 i 帧：
│   │                                      #     ctx.drawImage(img,
│   │                                      #       i * frameWidth, 0,
│   │                                      #       frameWidth, frameHeight,
│   │                                      #       0, 0, canvasW, canvasH)
│   │                                      #
│   │                                      #   各 Sheet 参数（实测图片后填入）：
│   │                                      #   ┌──────────┬──────┬─────┬───────────────────┐
│   │                                      #   │ 文件     │ cols │ fps │ 对应 PetAction     │
│   │                                      #   ├──────────┼──────┼─────┼───────────────────┤
│   │                                      #   │ usual    │  ?   │  8  │ idle, happy        │
│   │                                      #   │ chat     │  ?   │ 10  │ talk               │
│   │                                      #   │ tired    │  ?   │  6  │ sleep, yawn        │
│   │                                      #   │ prompt   │  ?   │  8  │ worried, stretch   │
│   │                                      #   └──────────┴──────┴─────┴───────────────────┘
│   │                                      #   cols 值在首次开发时打开图片量出，
│   │                                      #   填入 src/engine/spriteConfig.ts
│   │
│   ├── data/                              # 健康数据持久化存储（Electron fs 读写）
│   │   ├── pet-config.json                #   宠物配置（选宠后写入，替代 localStorage）
│   │   ├── health-today.json              #   今日原始健康数据（采集器实时更新）
│   │   ├── health-history/                #   历史每日快照
│   │   │   └── YYYY-MM-DD.json            #     每天一个文件，记录当日 HealthState
│   │   └── chat-history.json             #   对话记录（最近100条，Phase 2启用）
│   │
│   └── icons/
│       └── tray-icon.png                  # 系统托盘图标（16×16 或 32×32 PNG）
│
│
├── electron/                              ← Electron 主进程
│   ├── main.ts                            # 入口：窗口创建、托盘、IPC、快捷键
│   ├── preload.ts                         # contextBridge 暴露安全 API
│   └── ipc/
│       └── types.ts                       # IPC 事件名枚举 + payload 类型
│
│
└── src/                                   ← React 渲染进程
    ├── main.tsx                           # ReactDOM.createRoot 挂载
    ├── App.tsx                            # MemoryRouter + 路由表
    ├── index.css                          # Tailwind 指令 + 全局字体/滚动条
    │
    │
    ├── pages/                             # ── 页面层 ──────────────────────────
    │   ├── TreehouseEntry/
    │   │   └── index.tsx                  # 启动页
    │   │                                  #   treehouseorigin.jpg 渐入
    │   │                                  #   点击任意区域 → PetSelection（首次）
    │   │                                  #   已选宠 → 2s 后跳 PetOverlay
    │   │
    │   ├── PetSelection/
    │   │   └── index.tsx                  # 宠物选择向导（4步）
    │   │                                  #   Step 0: 种类（麻雀/玄凤/伯劳/雨燕）
    │   │                                  #   Step 1: 毛色 + 性别
    │   │                                  #   Step 2: 性格（4种）
    │   │                                  #   Step 3: 命名（最多12字）
    │   │                                  #   完成 → TreehouseWindow 淡出
    │   │                                  #         PetWindow 创建并显示
    │   │
    │   └── PetOverlay/
    │       └── index.tsx                  # 桌面悬浮宠物主界面（PetWindow 加载）
    │                                      #   渲染 PetSprite（序列帧动画）
    │                                      #   渲染 SpeechBubble（对话气泡）
    │                                      #   鼠标按下拖拽 → IPC window-move
    │                                      #   点击宠物 → 互动台词
    │                                      #   右键菜单：查看健康 / 设置 / 退出
    │
    │
    ├── components/                        # ── UI 组件层 ───────────────────────
    │   ├── PetSprite.tsx                  # 精灵图切分动画组件
    │   │                                  #   读取 spriteConfig 确定当前 action 对应的
    │   │                                  #   Sheet 文件 + cols + fps
    │   │                                  #   Canvas + rAF 循环：每帧按切分规则绘制
    │   │                                  #   action 切换时重置 frameIndex = 0
    │   │                                  #   Props: action(PetAction), size(px)
    │   │
    │   └── SpeechBubble.tsx              # 对话气泡
    │                                      #   Framer Motion 弹入（scale+opacity）
    │                                      #   自动 4s 后淡出
    │                                      #   支持普通文本 / 健康数据摘要
    │
    │
    ├── engine/                            # ── Pet Brain（宠物决策中枢）────────
    │   │
    │   ├── spriteConfig.ts                # 精灵图切分配置（唯一定义源）
    │   │                                  #   export const SPRITE_CONFIG: Record<
    │   │                                  #     PetAction, SpriteSheetDef>
    │   │                                  #   SpriteSheetDef = {
    │   │                                  #     file: string,  // 相对 assetstore/pets/birds/gentle/
    │   │                                  #     cols: number,  // 实测后填入
    │   │                                  #     fps:  number,
    │   │                                  #   }
    │   │
    │   ├── petBrain.ts                    # 🧠 核心决策函数
    │   │                                  #   Input:  HealthState + PetConfig
    │   │                                  #   Output: { action, message, systemCmd }
    │   │                                  #   流程: analyzeHealth → mapAction
    │   │                                  #         → selectMessage → emit
    │   │
    │   ├── healthAnalyzer.ts              # 健康状态分析（4维度评分）
    │   │                                  #   能量分 energy:    0-100
    │   │                                  #   压力分 stress:    0-100
    │   │                                  #   息息风险 burnout: 0-100
    │   │                                  #   久坐风险 sedentary:0-100
    │   │                                  #   Input: RawHealthData → HealthState
    │   │
    │   ├── stateMachine.ts                # 宠物状态机（6种状态）
    │   │                                  #   Idle → Happy / Sleepy / Stress
    │   │                                  #        / Exercise / Talk
    │   │                                  #   状态优先级规则（见第七节）
    │   │
    │   ├── behaviorMapping.ts             # HealthState → PetAction 映射规则
    │   │                                  #   优先级: sleep > yawn > stretch
    │   │                                  #           > stressed > happy > idle
    │   │
    │   └── dialogLibrary.ts              # 台词库（5种性格 × 6种动作 × 3-4条）
    │                                      #   + 点击互动台词（每种性格3条）
    │                                      #   + Phase2: LLM 生成接口占位
    │
    │
    ├── features/                          # ── Pet Response Engine 5大功能 ─────
    │   │
    │   ├── assistant/
    │   │   └── assistantActions.ts        # ① 助手功能
    │   │                                  #   打开文件 / 打开应用 / 播放音乐
    │   │                                  #   日程提醒（Windows 通知）
    │   │                                  #   Phase 1: 打开文件浏览器 + 定时提醒
    │   │
    │   ├── interaction/
    │   │   └── emotionActions.ts          # ② 互动功能（情感动作）
    │   │                                  #   触发: 卖萌 / 打哈欠 / 蹭蹭你
    │   │                                  #         伸懒腰 / 开心跳跳
    │   │                                  #   映射到对应 PetAction + 序列帧
    │   │
    │   ├── chat/
    │   │   ├── chatManager.ts             # ③ 聊天功能
    │   │   │                              #   Phase 1: 规则匹配关键词 → 台词响应
    │   │   │                              #   Phase 2: 调用 LLM API
    │   │   │                              #   上下文: 注入当前健康状态
    │   │   └── chatStore.ts               #   对话历史（最近20条）
    │   │
    │   ├── health-prompt/
    │   │   └── promptScheduler.ts         # ④ 提示功能（健康干预调度）
    │   │                                  #   久坐提醒（≥60min → stretch）
    │   │                                  #   喝水提醒（每2h一次）
    │   │                                  #   休息建议（fatigue≥75 → yawn）
    │   │                                  #   深呼吸训练（stress≥65）
    │   │                                  #   运动任务（sedentary≥80）
    │   │
    │   └── personality/
    │       └── personalityConfig.ts       # ⑤ 调教性格（陪伴风格配置）
    │                                      #   教练型 → 严格督促语气
    │                                      #   朋友型 → 温柔陪伴语气
    │                                      #   吐槽型 → 幽默激发语气
    │                                      #   治愈型 → 情绪支持语气
    │
    │
    ├── collector/                         # ── 数据采集层（Phase 2 实现）───────
    │   ├── index.ts                       # 采集器统一入口（start/stop）
    │   ├── keyMouseCollector.ts           # 键盘/鼠标活动采集
    │   │                                  #   keystrokes/min, mouse clicks/min
    │   ├── screenTimeCollector.ts         # 屏幕使用时长 & 应用使用情况
    │   ├── sedentaryDetector.ts           # 久坐检测（连续无活动时长）
    │   └── manualInput.ts                 # 手动输入：步数/饮水/心情
    │                                      #   （通过系统托盘菜单或右键菜单）
    │
    │
    ├── store/                             # ── 全局状态 ────────────────────────
    │   ├── petStore.ts                    # 宠物配置 + 当前动作 + onboarding状态
    │   │                                  #   PetConfig（种类/毛色/性别/性格/名字）
    │   │                                  #   PetAction（idle/happy/yawn/...）
    │   │                                  #   持久化: IPC → assetstore/data/pet-config.json
    │   │
    │   └── healthStore.ts                 # 健康快照运行时状态（内存）
    │                                      #   RawHealthData（当前原始采集数据）
    │                                      #   HealthState（4维度评分，实时计算）
    │                                      #   持久化: IPC → assetstore/data/health-today.json
    │                                      #   每日归档: assetstore/data/health-history/YYYY-MM-DD.json
    │
    │
    ├── hooks/                             # ── React Hooks ─────────────────────
    │   ├── useHealthSnapshot.ts           # 定时拉取健康快照（每60s）
    │   │                                  #   Phase 1: 读 mockHealthData
    │   │                                  #   Phase 2: IPC get-health-data
    │   │
    │   └── usePetBrain.ts                 # 驱动宠物决策循环
    │                                      #   监听 healthStore 变化
    │                                      #   调用 petBrain.decide()
    │                                      #   更新 petStore.action + 触发气泡
    │
    │
    └── mock/                              # ── Phase 1 Mock 数据 ───────────────
        └── mockHealthData.ts              # 模拟健康原始数据
                                           #   steps: 8432 / goal: 10000
                                           #   sleep: 7h30m, quality: 4
                                           #   screenTime: 4h23m
                                           #   keystrokes: 12453
                                           #   heartRate: 72 bpm
                                           #   water: 6/8 杯
                                           #   mood: null
                                           #   sedentaryMinutes: 97
```

---

## 四、窗口架构（Electron 主进程）

### 4.1 TreehouseWindow（启动 + 选宠，仅首次或重新召唤）

```typescript
BrowserWindow {
  width:  960,  height: 640
  center: true
  frame:  false
  transparent: false
  backgroundColor: '#0d0d1a'
  webPreferences: { preload, contextIsolation: true }
}
// 路由: '/'（TreehouseEntry）→ '/select-pet'（PetSelection）
// 选宠完成后: 淡出销毁 → 创建 PetWindow
```

### 4.2 PetWindow（桌面悬浮宠物，常驻后台）

```typescript
BrowserWindow {
  width:  200,  height: 240
  x: screenW - 230,  y: screenH - 270    // 右下角
  frame:       false
  transparent: true
  alwaysOnTop: true
  skipTaskbar: true
  resizable:   false
  hasShadow:   false
  webPreferences: { preload, contextIsolation: true }
}
// 路由: '/pet-overlay'（PetOverlay）
// 关闭 = 隐藏（真正退出走托盘菜单）
```

### 4.3 系统托盘菜单

```
显示/隐藏宠物       → PetWindow.show() / hide()
手动记录饮水        → 触发 IPC add-water-record
手动记录步数        → 触发 IPC add-steps
查看健康报告        → 打开 TreehouseWindow（/report 路由，Phase 2）
退出               → app.quit()
```

### 4.4 IPC 事件总线

| 事件名 | 方向 | Payload | 说明 |
|---|---|---|---|
| `window-move` | renderer → main | `{deltaX, deltaY}` | 拖拽宠物窗口 |
| `pet-config-save` | renderer → main | `PetConfig` | 选宠完成持久化 |
| `get-health-data` | renderer → main (handle) | — | 返回 RawHealthData |
| `add-water-record` | tray → main → renderer | `{cups}` | 手动记录饮水 |
| `add-steps` | tray → main → renderer | `{steps}` | 手动记录步数 |
| `pet-action-trigger` | main → renderer | `PetAction` | 决策引擎驱动动作 |
| `show-speech-bubble` | main → renderer | `{text, duration}` | 强制显示气泡 |

---

## 五、路由与页面流程

```
MemoryRouter
  /              TreehouseEntry    启动页（树屋图渐入）
  /select-pet    PetSelection      4步选宠向导
  /pet-overlay   PetOverlay        桌面宠物悬浮界面
```

### 状态机（onboarding 流程）

```
App 启动
  └─ isOnboarded?
       ├─ No  → TreehouseEntry（树屋渐入）
       │         → 点击 → PetSelection（选宠）
       │                 → 完成 → 销毁 TreehouseWindow
       │                         → 创建 PetWindow（PetOverlay）
       └─ Yes → TreehouseEntry（树屋渐入，2s）
                 → 自动跳转 PetOverlay（PetWindow 已存在）
```

---

## 六、宠物动作状态机

### 6.1 六种状态（来自规划图）

| 状态 | PetAction | 使用 Sheet | 触发条件 |
|---|---|---|---|
| Idle 待机 | `idle` | `usual.png` | 默认，无特殊触发 |
| Happy 开心 | `happy` | `usual.png` | energy≥70 且 stress<30 |
| Sleepy 困倦 | `yawn` / `sleep` | `tired.png` | 23:00-06:00 → sleep；fatigue≥75 → yawn |
| Stress 压力 | `worried` | `prompt.png` | stress≥65 或 hydrationDue |
| Exercise 运动 | `stretch` | `prompt.png` | sedentary≥60min |
| Talk 对话 | `talk` | `chat.png` | 用户主动触发聊天 / 宠物主动发话 |

### 6.2 状态优先级（高→低）

```
sleep > yawn > stretch > worried > talk > happy > idle
```

### 6.3 动作表现形式（4维度）

| 维度 | 实现方式 |
|---|---|
| 表情变化 | 序列帧 PNG 直接体现（不同帧 = 不同表情） |
| 肢体动作 | 序列帧 PNG（翅膀/身体动作） |
| 场景交互 | SpeechBubble 弹出（对话气泡 + 文字） |
| 特效反馈 | Framer Motion 缩放/颤动/发光（Phase 2 扩展） |

---

## 七、健康状态分析（4维度）

```typescript
interface HealthState {
  energy:    number;   // 0-100，越低越需要休息
  stress:    number;   // 0-100，越高越需要放松
  burnout:   number;   // 0-100，息息风险（长期过劳）
  sedentary: number;   // 0-100，久坐风险（连续无活动）
}

// 示例（规划图中的数值）:
// { energy: 32, stress: 81, burnout: 76, sedentary: 89 }
```

### 分析规则（`healthAnalyzer.ts`）

| 维度 | 计算依据 |
|---|---|
| `energy` | 100 - fatigueScore（由睡眠时长+心率+按键活跃度推算） |
| `stress` | 按键频率异常 + 鼠标速度 + 连续工作时长 |
| `burnout` | 最近7日平均工作时长 + 睡眠质量趋势 |
| `sedentary` | 当前连续无鼠标键盘活动分钟数 |

---

## 八、Pet Response Engine — 5大功能详解

### ① 助手功能（`features/assistant/`）

| 功能 | Phase 1 | Phase 2 |
|---|---|---|
| 打开文件 | 调用 shell.openPath（Electron） | — |
| 播放音乐 | 调用 shell.openExternal（网易云/Spotify URI） | — |
| 打开应用 | shell.openPath（.exe 路径） | NLP 意图识别 |
| 日程提醒 | setTimeout + Windows Toast | 接入日历 API |

### ② 互动功能（`features/interaction/`）

| 动作 | PetAction | 触发方式 |
|---|---|---|
| 猫咪卖萌 | `happy` | 随机（每15min有概率触发） |
| 打哈欠 | `yawn` | 健康驱动 / 用户长时间无操作 |
| 蹭蹭你 | `idle`+气泡 | 用户点击宠物 |
| 伸懒腰 | `stretch` | 久坐≥60min |
| 开心跳跳 | `happy` | 用户完成行为任务（如喝水打卡） |

### ③ 聊天功能（`features/chat/`）

```
Phase 1（规则匹配）:
  用户输入 → 关键词匹配 → 从 dialogLibrary 选台词 → SpeechBubble 显示

Phase 2（LLM 对话）:
  用户输入 + System Prompt（注入健康状态 + 性格设定）→ LLM API
  System Prompt 示例:
    "你是一只[性格]的宠物鸟，名叫[名字]。
     用户当前健康状态：能量32，压力81，已久坐97分钟。
     请用[性格]的口吻给出关心和建议，不超过50字。"
```

### ④ 提示功能调度（`features/health-prompt/`）

| 触发条件 | 动作 | 台词示例 |
|---|---|---|
| sedentary ≥ 60min | `stretch` | "坐了一个多小时了，站起来走走吧～" |
| 距上次喝水 ≥ 2h | `worried` + 气泡 | "该喝水了！" |
| fatigue ≥ 75 | `yawn` | "你看起来很累了，要不要小憩一会儿？" |
| stress ≥ 65 | `worried` | "有点压力大呢，先做个深呼吸？" |
| sedentary ≥ 80 | 特殊气泡 | "我们出去走5分钟吧，我陪你！" |

### ⑤ 调教性格（`features/personality/`）

| 性格ID | 名称 | 风格说明 |
|---|---|---|
| `coach` | 教练型 | 严格督促，目标导向，不接受借口 |
| `friend` | 朋友型 | 温柔陪伴，理解共情，暖心鼓励 |
| `roast` | 吐槽型 | 幽默激发，嘴硬心软，傲娇风 |
| `healer` | 治愈型 | 情绪支持，无条件接纳，疗愈系 |

> 注：旧版台词库（5种性格：gentle/tsundere/cheerful/calm/playful）可直接映射到新4种性格体系，或保留5种作为内部标识。

---

## 九、数据结构定义

### PetConfig（宠物配置）

```typescript
interface PetConfig {
  userId:       string;                                         // 'local'
  name:         string;                                         // 最多12字
  species:      'sparrow' | 'cockatiel' | 'shrike' | 'swift'; // 麻雀/玄凤/伯劳/雨燕
  gender:       'male' | 'female';
  personality:  'coach' | 'friend' | 'roast' | 'healer';      // 4种性格
  featherColor: 'yellow' | 'blue' | 'green' | 'white' | 'brown' | 'orange';
}
```

### RawHealthData（原始采集数据）

```typescript
interface RawHealthData {
  steps:            number;           // 今日步数
  sleepMinutes:     number;           // 昨晚睡眠分钟数
  sleepQuality:     1 | 2 | 3 | 4 | 5;
  heartRate:        number | null;    // 心率（可选，需硬件）
  waterCups:        number;           // 今日饮水杯数
  mood:             number | null;    // 1-5 心情评分
  sedentaryMinutes: number;           // 当前连续久坐分钟数
  keystrokesPerMin: number;           // 最近10min平均按键频率
  screenTimeMinutes:number;           // 今日屏幕时间（分钟）
  activeMinutes:    number;           // 今日有效工作分钟数
}
```

### HealthState（分析后输出，给 Pet Brain）

```typescript
interface HealthState {
  energy:    number;   // 0-100（低=需要休息）
  stress:    number;   // 0-100（高=需要放松）
  burnout:   number;   // 0-100（高=过劳风险）
  sedentary: number;   // 0-100（高=久坐风险）
  hydrationDue: boolean;              // 是否该喝水
  sleepDue:     boolean;              // 是否该睡觉（23:00-06:00）
  timestamp:    number;               // Unix ms
}
```

### PetAction（宠物动作枚举）

```typescript
type PetAction = 'idle' | 'happy' | 'yawn' | 'sleep' | 'stretch' | 'worried' | 'talk';
```

### SpriteSheetDef（精灵图切分配置）

```typescript
interface SpriteSheetDef {
  file: string;    // 相对路径，如 'pets/birds/gentle/usual.png'
  cols: number;    // 横向帧数（实测图片后填入）
  fps:  number;    // 播放帧率
}

// 完整配置见 src/engine/spriteConfig.ts
// 多个 PetAction 可共用同一张 Sheet，Canvas 绘制方式相同，仅 fps 可不同
```

### BrainOutput（Pet Brain 决策输出）

```typescript
interface BrainOutput {
  action:     PetAction;        // 驱动精灵图切分动画
  message:    string | null;    // null = 不显示气泡
  systemCmd:  SystemCmd | null; // 助手功能指令（Phase 2）
}

type SystemCmd =
  | { type: 'open-file';  path: string }
  | { type: 'open-url';   url: string }
  | { type: 'notify';     title: string; body: string }
  | { type: 'play-music'; query: string };
```

---

## 十、assetstore 配置（取代 public/）

### 10.1 静态图片访问（Vite publicDir）

`vite.config.ts`（渲染进程）中设置：

```typescript
import path from 'path';
export default {
  publicDir: path.resolve(__dirname, 'assetstore'),
  // 效果：assetstore/pets/birds/gentle/usual.png
  //       渲染进程访问路径 → /pets/birds/gentle/usual.png
  //       代码中引用: img.src = 'pets/birds/gentle/usual.png'
  //
  //       assetstore/treehouse/treehouseorigin.jpg
  //       代码中引用: src="treehouse/treehouseorigin.jpg"
}
```

### 10.2 数据文件读写（Electron fs，通过 IPC）

`assetstore/data/` 目录由主进程负责读写，渲染进程通过 IPC 交互：

```typescript
// 主进程处理（electron/main.ts）
import fs from 'node:fs/promises';
import path from 'node:path';

const DATA_DIR = path.join(app.getPath('userData'), '..', '..', 'assetstore', 'data');
// 开发环境直接用项目根下的 assetstore/data/
// 生产环境用 extraResources 复制到 resources/assetstore/data/

// IPC 处理示例
ipcMain.handle('read-data', async (_, filename: string) => {
  const file = path.join(DATA_DIR, filename);
  try { return JSON.parse(await fs.readFile(file, 'utf-8')); }
  catch { return null; }
});

ipcMain.handle('write-data', async (_, filename: string, data: unknown) => {
  const file = path.join(DATA_DIR, filename);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf-8');
});
```

### 10.3 数据文件职责表

| 文件 | 读写时机 | 内容 |
|---|---|---|
| `data/pet-config.json` | 选宠完成写入，启动时读取 | `PetConfig` 对象 |
| `data/health-today.json` | 采集器每60s更新 | `RawHealthData` 当日快照 |
| `data/health-history/YYYY-MM-DD.json` | 每日0:00归档 | `HealthState` 历史记录 |
| `data/chat-history.json` | 每次对话追加（Phase 2） | 最近100条消息 |

### 10.4 打包配置

```typescript
// electron-builder.config.ts
extraResources: [
  { from: 'assetstore/pets/',      to: 'assetstore/pets/' },
  { from: 'assetstore/treehouse/', to: 'assetstore/treehouse/' },
  { from: 'assetstore/icons/',     to: 'assetstore/icons/' },
  // data/ 目录不打包（运行时动态生成）
]
```

---

## 十一、开发阶段计划

### Phase 1 — MVP（立即启动）

**目标**：完整的桌面宠物视觉体验，mock 健康数据驱动

- [ ] `01` 项目脚手架（electron-vite init，配置 Tailwind + Framer Motion）
- [ ] `02` 量出 4 张精灵图的帧数（cols），填入 `spriteConfig.ts`
- [ ] `03` `spriteConfig.ts`（精灵图切分参数，Sheet 与 PetAction 的映射表）
- [ ] `04` `PetSprite.tsx`（Canvas 按 spriteConfig 切分绘制，rAF 循环）
- [ ] `05` `SpeechBubble.tsx`（Framer Motion 弹入弹出）
- [ ] `06` `TreehouseEntry` 页面（`treehouseorigin.jpg` 渐入，点击进入选宠）
- [ ] `07` `PetSelection` 页面（4步向导，复用旧版布局）
- [ ] `08` `petStore.ts` + `healthStore.ts`（Zustand 运行时状态）
- [ ] `09` IPC 数据文件读写（`read-data` / `write-data` 句柄，assetstore/data/）
- [ ] `10` `mockHealthData.ts` + `healthAnalyzer.ts`（4维度评分计算）
- [ ] `11` `behaviorMapping.ts` + `dialogLibrary.ts`（复用旧版台词库）
- [ ] `12` `petBrain.ts` 决策核心（串联分析→映射→台词→输出）
- [ ] `13` `PetOverlay` 页面（透明悬浮、拖拽、右键菜单）
- [ ] `14` `promptScheduler.ts`（久坐/喝水/疲劳定时提醒）
- [ ] `15` Electron `main.ts`（双窗口切换、系统托盘、IPC 注册）
- [ ] `16` 联调测试（全流程：启动→选宠→悬浮宠物→健康提醒）

### Phase 2 — 数据接入（MVP 稳定后）

- [ ] `collector/keyMouseCollector.ts`（真实键鼠活动采集）
- [ ] `collector/screenTimeCollector.ts`（屏幕时间统计）
- [ ] `collector/sedentaryDetector.ts`（连续久坐检测）
- [ ] `collector/manualInput.ts`（步数/饮水手动输入）
- [ ] IPC 数据通道接入 PetOverlay
- [ ] Windows Toast 通知（`node-notifier` 或 Electron `Notification`）
- [ ] 助手功能（打开文件/应用/网页）

### Phase 3 — 智能化（Phase 2 稳定后）

- [ ] `chat/chatManager.ts` 接入 LLM API（OpenAI / 本地模型）
- [ ] System Prompt 注入实时健康状态
- [ ] 对话历史管理（chatStore.ts）
- [ ] 健康数据可视化 Dashboard（TreehouseWindow 重新启用）
- [ ] 持续学习模块（用户行为回流优化提醒时机）

---

## 十二、关键文件复用自旧版（垃圾/health_buddy）

| 旧文件 | 新路径 | 改动说明 |
|---|---|---|
| `apps/web/src/components/PetSprite.tsx` | `src/components/PetSprite.tsx` | 核心 Canvas + rAF 逻辑保留；帧来源从逐帧PNG改为Sprite Sheet切分；新增 `spriteConfig` 引用 |
| `apps/web/src/mock/petBehaviorMapping.ts` | `src/engine/dialogLibrary.ts` + `behaviorMapping.ts` | 拆分为两个文件；性格映射从5种→4种 |
| `apps/web/src/store/petStore.ts` | `src/store/petStore.ts` | 移除外部类型引用；持久化改为 IPC→assetstore/data/pet-config.json |
| `apps/web/src/pages/PetSelection/index.tsx` | `src/pages/PetSelection/index.tsx` | 性格选项从5种改为4种，复用布局结构 |
| `apps/desktop-pet/src/main.ts` | `electron/main.ts` | 新增 read-data/write-data IPC 句柄；移除采集器启动（Phase 2） |
| `apps/web/src/components/SpeechBubble.tsx` | `src/components/SpeechBubble.tsx` | 直接复用 |
| `apps/web/src/mock/healthData.ts` | `src/mock/mockHealthData.ts` | 按新 RawHealthData 接口补充字段 |

> **彻底丢弃**：`apps/server`（后端）、`apps/mobile`（移动端）、`apps/treehouse`（SVG树屋）、`packages/`（monorepo共享包）、`apps/web/src/pages/Dashboard`（Phase 3 再做）

---

## 十三、开发规范

1. **资产路径**：所有静态文件放 `assetstore/`；图片通过 Vite `publicDir` 以 URL 引用；数据文件通过 IPC `read-data`/`write-data` 读写
2. **精灵图 cols 值**：在 `src/engine/spriteConfig.ts` 中集中定义，任何地方不得硬编码帧数
3. **类型定义**：共享类型集中在 `src/store/` 或 `src/engine/`，不建立独立 packages
4. **IPC 类型安全**：所有 IPC 事件名和 payload 类型定义在 `electron/ipc/types.ts`
5. **文件命名**：组件 PascalCase，工具/hooks/store camelCase，页面目录 PascalCase
6. **注释规范**：只注释"为什么"而非"做了什么"，台词/数据文件可加块注释说明来源
7. **提交顺序**：严格按 Phase 1 任务 01→16 顺序开发，每个任务独立可测

---

*文档由 AI 生成，如有疑问直接修改本文件后告知。*

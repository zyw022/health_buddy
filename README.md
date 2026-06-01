# Health Buddy

一款 Windows 桌面健康宠物应用。收集并分析健康数据，以桌面小鸟的形式给出陪伴、提醒与互动。

## 快速开始

**第一次使用：**

1. 双击 `setup.bat` — 自动检查/安装 Node.js，安装依赖，验证资产文件
2. 双击 `launch.bat` — 启动桌宠

**之后每次：** 直接双击 `launch.bat` 即可。

> 关闭 `launch.bat` 窗口会同时退出桌宠。也可通过系统托盘右键菜单隐藏宠物或退出。

## 使用流程

```
启动 → 树屋渐入 → 首次选宠（种类/毛色/性格/命名）
                    ↓
              桌面悬浮小鸟（可拖动、点击互动）
                    ↓
              健康提醒气泡（久坐 / 喝水 / 疲劳等）
```

## 环境要求

- Windows 10 / 11
- Node.js >= 18（`setup.bat` 可自动安装 v22 LTS）
- 网络（首次安装依赖时需要）

## 开发命令

```bash
npm run dev      # 开发模式（热重载）
npm run build    # 构建到 out/
npm run pack     # 构建 + 本地打包
npm run dist     # 构建 + 生成安装包
```

## 项目结构

```
health-buddy/
├── launch.bat / setup.bat     # 一键启动 & 环境配置
├── electron/                  # Electron 主进程、preload、IPC
├── src/
│   ├── pages/                 # TreehouseEntry / PetSelection / PetOverlay
│   ├── components/            # PetSprite、SpeechBubble
│   ├── engine/                # 健康分析、行为映射、宠物大脑
│   ├── store/                 # Zustand 状态管理
│   ├── hooks/                 # 健康快照、宠物决策
│   └── mock/                  # Phase 1 模拟健康数据
├── assetstore/                # 所有静态资产 & 运行时数据
│   ├── treehouse/             # 启动页树屋图
│   ├── pets/birds/gentle/     # 精灵图（4 张 Sprite Sheet）
│   └── data/                  # JSON 持久化（宠物配置、健康记录）
└── ARCHITECTURE.md            # 完整架构文档
```

## 技术栈

| 层 | 技术 |
|---|---|
| 桌面容器 | Electron |
| UI | React 18 + TypeScript |
| 构建 | electron-vite |
| 样式 | Tailwind CSS |
| 动画 | Framer Motion + Canvas Sprite Sheet |
| 状态 | Zustand |

## 当前进度（Phase 1）

- [x] 树屋启动 → 四步选宠 → 桌面悬浮宠物
- [x] 精灵图 Canvas 切分动画（7 种动作）
- [x] 健康数据 Mock 驱动 + 4 维度分析
- [x] 4 种性格台词库 + 定时健康提醒
- [x] 透明窗口点击穿透（桌面可正常操作）
- [x] 系统托盘（显示/隐藏、记录喝水、退出）
- [ ] Phase 2：真实健康数据采集
- [ ] Phase 3：AI 对话与智能分析

## 文档

详细架构、数据流、IPC 协议、开发规范见 [ARCHITECTURE.md](./ARCHITECTURE.md)。

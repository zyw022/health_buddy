#!/usr/bin/env bash
# ─────────────────────────────────────────────
# Health Buddy — 桌面宠物一键启动脚本
#
# 用法:
#   ./start.sh              完整模式（桌宠 + 树屋）
#   ./start.sh --pet-only   仅桌宠浮窗
#   ./start.sh --dev        开发模式（带 DevTools）
#   ./start.sh --web        仅启动 Web MVP（浏览器）
# ─────────────────────────────────────────────

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# ── 颜色输出 ──────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${CYAN}[INFO]${NC}  $1"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
err()   { echo -e "${RED}[ERROR]${NC} $1"; }

# ── 参数解析 ──────────────────────────────────
MODE="full"
for arg in "$@"; do
  case "$arg" in
    --pet-only) MODE="pet-only" ;;
    --dev)      MODE="dev" ;;
    --web)      MODE="web" ;;
    --help|-h)
      echo ""
      echo "  Health Buddy 桌面宠物启动器"
      echo ""
      echo "  用法: ./start.sh [选项]"
      echo ""
      echo "  选项:"
      echo "    (无参数)     完整模式：桌宠浮窗 + 树屋窗口"
      echo "    --pet-only   仅显示桌宠浮窗（右下角小鸟）"
      echo "    --dev        开发模式（附带 DevTools）"
      echo "    --web        仅启动 Web MVP（浏览器打开）"
      echo "    --help       显示此帮助"
      echo ""
      echo "  快捷键（Electron 模式）:"
      echo "    Ctrl+Shift+T   切换树屋窗口"
      echo ""
      exit 0
      ;;
  esac
done

# ── 环境检查 ──────────────────────────────────
echo ""
echo "  🐦 Health Buddy 桌面宠物启动器"
echo "  ─────────────────────────────────"
echo ""

# 检查 Node.js（优先系统 PATH，其次便携版）
PORTABLE_NODE="${LOCALAPPDATA:-$HOME/.local}/health-buddy-node/node-v22.16.0-win-x64"
if ! command -v node &> /dev/null; then
  if [ -x "$PORTABLE_NODE/node.exe" ]; then
    export PATH="$PORTABLE_NODE:$PATH"
    info "使用便携版 Node.js: $PORTABLE_NODE"
  else
    err "未检测到 Node.js，请先安装 Node.js >= 20"
    err "下载地址: https://nodejs.org"
    exit 1
  fi
fi

NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VER" -lt 20 ]; then
  err "Node.js 版本过低 ($(node -v))，需要 >= 20"
  exit 1
fi
ok "Node.js $(node -v)"

# 检查 npm
if ! command -v npm &> /dev/null; then
  err "未检测到 npm，请确认 Node.js 安装完整"
  exit 1
fi
ok "npm $(npm -v)"

# ── 安装依赖 ──────────────────────────────────
if [ ! -d "node_modules" ]; then
  info "首次启动，正在安装依赖（可能需要几分钟）..."
  npm install --legacy-peer-deps --ignore-scripts
  if [ ! -f "node_modules/electron/dist/electron.exe" ] && [ ! -f "node_modules/electron/dist/Electron.app/Contents/MacOS/Electron" ]; then
    info "正在下载 Electron 二进制..."
    node node_modules/electron/install.js
  fi
  echo ""
  ok "依赖安装完成"
else
  ok "依赖已就绪"
fi

# ── 启动 ──────────────────────────────────────
echo ""

case "$MODE" in
  web)
    info "启动 Web MVP（浏览器模式）..."
    info "打开浏览器访问 http://localhost:5173"
    echo ""
    npm run dev:web
    ;;
  pet-only)
    info "启动桌宠浮窗（仅小鸟，右下角）..."
    info "Ctrl+Shift+T 可打开树屋"
    echo ""
    npx electron legacy/electron-prototype/main.js --pet-only
    ;;
  dev)
    info "启动开发模式（桌宠 + 树屋 + DevTools）..."
    echo ""
    npx electron legacy/electron-prototype/main.js --dev
    ;;
  full)
    info "启动完整模式（桌宠 + 树屋）..."
    info "Ctrl+Shift+T 可切换树屋窗口"
    echo ""
    npx electron legacy/electron-prototype/main.js
    ;;
esac

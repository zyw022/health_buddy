# infra — 基础设施占位

> **TODO(phase-2):** 本目录在 Phase 2 多端联调阶段填充，MVP 不需要。

## 计划内容

### Docker Compose（本地联调）

```yaml
# TODO(phase-2): docker-compose.yml
# - service: server  (Hono + SQLite)
# - service: mobile-mock (模拟手机信号上报的脚本)
```

### CI / CD

- `TODO(phase-2):` GitHub Actions workflow — `typecheck:all` + `test:all` on PR
- `TODO(phase-2):` Web MVP 静态构建 → Vercel / GitHub Pages 自动部署
- `TODO(phase-3):` Electron 桌面端打包（electron-builder）→ GitHub Releases

### 生产部署（可选）

- `TODO(phase-3):` Server 容器化（`Dockerfile`）
- `TODO(phase-3):` 环境变量说明（`DEEPSEEK_API_KEY`、`DB_PATH` 等）

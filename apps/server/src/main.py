# TODO(phase-2): 迁移为 apps/server TypeScript + Hono（见 README MVP 对照表）。
# 当前为 Python FastAPI 桩，供 mobile/work-sessions 接口联调占位。
from fastapi import FastAPI

from src.api.mobile_signals import router as mobile_signals_router
from src.api.web_work_sessions import router as web_work_sessions_router

app = FastAPI(
    title="Health Buddy API",
    version="0.1.0",
    description="Backend API for low-friction health signals and public-computer work sessions.",
)

app.include_router(mobile_signals_router)
app.include_router(web_work_sessions_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}

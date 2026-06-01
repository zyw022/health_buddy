# TODO(phase-2): 持久化至 SQLite；与 packages/decision-engine 的 webSession 信号对齐。
from time import time
from typing import Literal
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/work-sessions", tags=["work-sessions"])


class StartWorkSessionRequest(BaseModel):
    userId: str
    source: Literal["browser_tab", "browser_extension", "qr_login"]


class WorkSessionResponse(BaseModel):
    sessionId: str
    userId: str
    startedAt: int
    lastHeartbeatAt: int
    endedAt: int | None = None
    source: Literal["browser_tab", "browser_extension", "qr_login"]


class HeartbeatRequest(BaseModel):
    sessionId: str
    userId: str


class EndSessionRequest(BaseModel):
    sessionId: str
    userId: str


# MVP in-memory store. Replace with Redis/PostgreSQL before production.
_sessions: dict[str, WorkSessionResponse] = {}


@router.post("", response_model=WorkSessionResponse)
def start_work_session(payload: StartWorkSessionRequest) -> WorkSessionResponse:
    """Start a voluntary public-computer work session.

    This endpoint is designed for QR login or a browser tab opened on a public
    computer. It records only a heartbeat, not the user's browsing history,
    keystrokes, screenshots, or page contents.
    """

    now = _now_ms()
    session = WorkSessionResponse(
        sessionId=str(uuid4()),
        userId=payload.userId,
        startedAt=now,
        lastHeartbeatAt=now,
        source=payload.source,
    )
    _sessions[session.sessionId] = session
    return session


@router.post("/heartbeat", response_model=WorkSessionResponse)
def heartbeat(payload: HeartbeatRequest) -> WorkSessionResponse:
    session = _get_user_session(payload.sessionId, payload.userId)
    if session.endedAt is not None:
        raise HTTPException(status_code=409, detail="session already ended")

    updated = session.model_copy(update={"lastHeartbeatAt": _now_ms()})
    _sessions[payload.sessionId] = updated
    return updated


@router.post("/end", response_model=WorkSessionResponse)
def end_session(payload: EndSessionRequest) -> WorkSessionResponse:
    session = _get_user_session(payload.sessionId, payload.userId)
    updated = session.model_copy(update={"endedAt": _now_ms()})
    _sessions[payload.sessionId] = updated
    return updated


@router.get("/{user_id}/active", response_model=list[WorkSessionResponse])
def active_sessions(user_id: str) -> list[WorkSessionResponse]:
    now = _now_ms()
    freshness_ms = 2 * 60 * 1000
    return [
        session
        for session in _sessions.values()
        if session.userId == user_id
        and session.endedAt is None
        and now - session.lastHeartbeatAt <= freshness_ms
    ]


def _get_user_session(session_id: str, user_id: str) -> WorkSessionResponse:
    session = _sessions.get(session_id)
    if session is None or session.userId != user_id:
        raise HTTPException(status_code=404, detail="session not found")
    return session


def _now_ms() -> int:
    return int(time() * 1000)

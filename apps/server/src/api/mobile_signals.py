# TODO(phase-2): 写入 SQLite；WebSocket 推送给 decisionLoop；JWT 校验 userId。
from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/mobile", tags=["mobile-signals"])


class PhoneScreenEvent(BaseModel):
    ts: int
    deviceId: str
    type: Literal["unlock", "lock", "interactive"]
    durationMs: int | None = None


class PhoneMotionEvent(BaseModel):
    ts: int
    deviceId: str
    state: Literal["stationary", "walking", "running", "vehicle", "unknown"]
    confidence: float = Field(ge=0, le=1)


class WechatStepRecord(BaseModel):
    date: str
    userId: str
    steps: int = Field(ge=0)
    source: Literal["wechat_motion", "healthkit", "google_fit"]


class ProximitySignal(BaseModel):
    ts: int
    userId: str
    source: Literal["same_wifi", "bluetooth", "local_network_ping", "manual_session"]
    nearKnownDesktop: bool
    confidence: float = Field(ge=0, le=1)
    desktopDeviceId: str | None = None


class MobileSignalBatch(BaseModel):
    userId: str
    deviceId: str
    collectedAt: int
    screenEvents: list[PhoneScreenEvent]
    motionEvents: list[PhoneMotionEvent]
    stepRecord: WechatStepRecord | None = None
    proximitySignals: list[ProximitySignal]


@router.post("/signals")
def upload_mobile_signals(batch: MobileSignalBatch) -> dict[str, int | str]:
    """Receive low-friction mobile signals.

    Persisting is intentionally left as a repository TODO. The API contract is
    already privacy-shaped: no precise location, message content, notification
    text, contact data, or raw sensor streams.
    """

    # TODO: authenticate userId from JWT instead of trusting request body.
    # TODO: write to time-series storage and expose to decisionLoop via WebSocket.
    accepted_events = (
        len(batch.screenEvents)
        + len(batch.motionEvents)
        + len(batch.proximitySignals)
        + (1 if batch.stepRecord is not None else 0)
    )
    return {"status": "accepted", "events": accepted_events}

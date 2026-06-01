// ─────────────────────────────────────────────
// apps/web/src/hooks/useHealthSnapshot.ts
//
// 获取健康快照的 React Hook。
// Phase 1 MVP 返回 mock 数据；Phase 2 改为 WebSocket 或 fetch。
//
// TODO(phase-2): 订阅 WebSocket 消息推送，实时更新快照。
// TODO(phase-2): 失败时 fallback 到 getMockHealthSnapshot()。
// ─────────────────────────────────────────────

import { useState, useEffect } from 'react';
import type { HealthSnapshot } from '@health-buddy/shared-types';
import { getMockHealthSnapshot } from '../mock/healthData';

export function useHealthSnapshot(): HealthSnapshot {
  const [snapshot, setSnapshot] = useState<HealthSnapshot>(getMockHealthSnapshot);

  useEffect(() => {
    // MVP: 直接使用 mock 数据
    setSnapshot(getMockHealthSnapshot());

    // TODO(phase-2): 订阅 WebSocket，收到 'health-update' 消息时 setSnapshot(data)
  }, []);

  return snapshot;
}

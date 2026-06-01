// ─────────────────────────────────────────────
// Dashboard — 树屋主界面
//
// 左侧（桌面）/ 上方（移动）：小鸟 + 说话气泡
// 右侧（桌面）/ 下方（移动）：健康卡片 + 数据
// ─────────────────────────────────────────────

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PetSprite } from '../../components/PetSprite';
import { SpeechBubble } from '../../components/SpeechBubble';
import { HealthCards } from '../../components/HealthCards';
import { usePetStore, type PetAction } from '../../store/petStore';
import { getMockHealthSnapshot } from '../../mock/healthData';
import {
  getPetMessage,
  mapHealthToAction,
} from '../../mock/petBehaviorMapping';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { config, currentAction, setAction, setLatestHealth, latestHealth } = usePetStore();
  const [bubbleVisible, setBubbleVisible] = useState(true);
  const [currentMessage, setCurrentMessage] = useState('');

  // 没有宠物配置时重定向
  useEffect(() => {
    if (!config) {
      navigate('/');
    }
  }, [config, navigate]);

  // 加载 mock 健康数据并驱动小鸟行为
  const refresh = useCallback(() => {
    const health = getMockHealthSnapshot();
    setLatestHealth(health);

    const action = mapHealthToAction(health);
    setAction(action as PetAction);

    const msg = getPetMessage(health, config?.personality ?? 'gentle', action);
    setCurrentMessage(msg);
    setBubbleVisible(true);
  }, [config, setAction, setLatestHealth]);

  useEffect(() => {
    refresh();
    // 每 5 分钟刷新一次（Phase 2 替换为实时 WebSocket 推送）
    const interval = setInterval(refresh, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refresh]);

  if (!config) return null;

  return (
    <div
      className="w-screen h-screen flex flex-col overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at 30% 40%, #1b2a4a 0%, #0d0d1a 100%)',
      }}
    >
      {/* 顶部标题栏 */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between px-6 pt-8 pb-4"
      >
        <div>
          <h2 className="text-white text-lg font-medium">{config.name} 的树屋</h2>
          <p className="text-white/40 text-xs mt-0.5">
            {new Date().toLocaleDateString('zh-CN', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={refresh}
            className="
              w-9 h-9 rounded-full
              bg-white/10 hover:bg-white/20
              flex items-center justify-center
              text-white/70 text-base
              transition-colors
            "
            title="刷新数据"
          >
            ↻
          </button>
          <button
            onClick={() => navigate('/')}
            className="
              w-9 h-9 rounded-full
              bg-white/10 hover:bg-white/20
              flex items-center justify-center
              text-white/70 text-sm
              transition-colors
            "
            title="回到树屋入口"
          >
            🏠
          </button>
        </div>
      </motion.div>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 px-6 pb-8 overflow-hidden">
        {/* 左侧：宠物区域 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="
            flex flex-col items-center justify-center
            md:w-56 flex-none
            relative
          "
        >
          {/* 树屋背景板 */}
          <div
            className="absolute inset-0 rounded-3xl opacity-30"
            style={{
              background: 'radial-gradient(circle at 50% 60%, #4a3728 0%, transparent 70%)',
            }}
          />

          {/* 说话气泡 */}
          <div className="relative z-10 mb-3 w-full flex justify-center">
            <SpeechBubble
              text={currentMessage}
              visible={bubbleVisible}
              onDismiss={() => setBubbleVisible(false)}
              autoDismissMs={12000}
              className="max-w-[220px]"
            />
          </div>

          {/* 小鸟 */}
          <div
            className="relative z-10 cursor-pointer"
            onClick={() => {
              setAction('happy');
              setBubbleVisible(true);
              setCurrentMessage(
                config.personality === 'tsundere'
                  ? '哼，你干嘛戳我……不是不开心啦！'
                  : config.personality === 'cheerful'
                  ? '哇你点我了！！我好开心啊！'
                  : '嗯……我在这里呢。',
              );
              setTimeout(() => setAction('idle'), 3000);
            }}
            title="点击互动"
          >
            <PetSprite config={config} action={currentAction} size={140} />
          </div>

          {/* 互动提示 */}
          <p className="relative z-10 text-white/25 text-xs mt-3">
            点击小鸟互动
          </p>

          {/* 当前状态标签 */}
          <div className="relative z-10 mt-2">
            <ActionBadge action={currentAction} />
          </div>
        </motion.div>

        {/* 右侧：健康数据 */}
        <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
          {latestHealth ? (
            <>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-white/40 text-xs px-1 mb-3"
              >
                当前健康快照 · 来自模拟数据
              </motion.p>
              <HealthCards health={latestHealth} />
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-white/30 text-sm">正在加载数据…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 当前动作状态标签
const ACTION_LABELS: Record<PetAction, { label: string; color: string }> = {
  idle: { label: '悠闲', color: '#4CAF50' },
  yawn: { label: '困了', color: '#9C27B0' },
  stretch: { label: '需要伸展', color: '#FF9800' },
  happy: { label: '开心', color: '#2196F3' },
  worried: { label: '担心你', color: '#FF5722' },
  sleep: { label: '睡觉中', color: '#607D8B' },
};

const ActionBadge: React.FC<{ action: PetAction }> = ({ action }) => {
  const info = ACTION_LABELS[action];
  return (
    <div
      className="px-3 py-1 rounded-full text-xs text-white font-medium"
      style={{ background: `${info.color}33`, border: `1px solid ${info.color}66` }}
    >
      <span style={{ color: info.color }}>● </span>
      {info.label}
    </div>
  );
};

export default Dashboard;

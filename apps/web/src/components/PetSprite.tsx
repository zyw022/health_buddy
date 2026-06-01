// ─────────────────────────────────────────────
// PetSprite — 小鸟帧动画组件
//
// Phase 1：用 CSS + inline SVG 占位动画。
// Phase 2：替换为真实 PNG 序列帧（在 public/sprites/ 目录下放帧图片）。
// ─────────────────────────────────────────────

import React, { useEffect, useRef } from 'react';
import type { PetConfig } from '@health-buddy/shared-types';
import type { PetAction } from '../store/petStore';

interface Props {
  config: PetConfig;
  action: PetAction;
  size?: number;
}

// 各动作对应的 SVG body 颜色映射（简单占位）
const FEATHER_COLORS: Record<string, string> = {
  yellow: '#FFD54F',
  blue: '#42A5F5',
  green: '#66BB6A',
  white: '#FAFAFA',
  brown: '#8D6E63',
  orange: '#FFA726',
};

// 动作说明（Phase 2 替换为帧动画序列）
const ACTION_LABELS: Record<PetAction, string> = {
  idle: '悠闲待机',
  yawn: '打哈欠',
  stretch: '伸懒腰',
  happy: '开心',
  worried: '担心',
  sleep: '睡觉',
};

export const PetSprite: React.FC<Props> = ({ config, action, size = 120 }) => {
  const bodyColor = FEATHER_COLORS[config.featherColor] ?? '#FFD54F';
  const wingRef = useRef<SVGPathElement>(null);

  // 动作动画触发
  useEffect(() => {
    const wing = wingRef.current;
    if (!wing) return;

    if (action === 'happy' || action === 'stretch') {
      wing.style.animation = 'wingFlap 0.4s ease-in-out 3';
    } else {
      wing.style.animation = '';
    }
  }, [action]);

  const eyeClose = action === 'sleep' || action === 'yawn';
  const isWorried = action === 'worried';

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      title={ACTION_LABELS[action]}
    >
      <style>{`
        @keyframes wingFlap {
          0% { transform: rotate(0deg); }
          50% { transform: rotate(-20deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes petBob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes petWorry {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-4deg); }
          75% { transform: rotate(4deg); }
        }
        .pet-bob { animation: petBob 2s ease-in-out infinite; }
        .pet-worry { animation: petWorry 0.5s ease-in-out 4; }
      `}</style>

      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className={action === 'worried' ? 'pet-worry' : 'pet-bob'}
      >
        {/* 尾巴 */}
        <ellipse cx="50" cy="82" rx="14" ry="7" fill={bodyColor} opacity="0.85" />

        {/* 身体 */}
        <ellipse cx="50" cy="60" rx="22" ry="26" fill={bodyColor} />

        {/* 翅膀 */}
        <path
          ref={wingRef}
          d="M28 58 Q18 50 22 38 Q30 52 36 58 Z"
          fill={bodyColor}
          opacity="0.9"
          style={{ transformOrigin: '32px 58px' }}
        />
        <path
          d="M72 58 Q82 50 78 38 Q70 52 64 58 Z"
          fill={bodyColor}
          opacity="0.9"
          style={{ transformOrigin: '68px 58px' }}
        />

        {/* 头部 */}
        <circle cx="50" cy="36" r="20" fill={bodyColor} />

        {/* 冠毛（部分种类） */}
        {config.species === 'cockatiel' && (
          <path d="M48 18 Q50 10 52 18" stroke={bodyColor} strokeWidth="3" fill="none" />
        )}

        {/* 眼睛 */}
        {eyeClose ? (
          <>
            <path d="M41 34 Q43 37 45 34" stroke="#333" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M55 34 Q57 37 59 34" stroke="#333" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx="43" cy="34" r="5" fill="white" />
            <circle cx="57" cy="34" r="5" fill="white" />
            <circle cx={isWorried ? 44 : 43} cy="34" r="3" fill="#222" />
            <circle cx={isWorried ? 58 : 57} cy="34" r="3" fill="#222" />
            {/* 高光 */}
            <circle cx="45" cy="32" r="1" fill="white" />
            <circle cx="59" cy="32" r="1" fill="white" />
          </>
        )}

        {/* 喙 */}
        <path d="M47 41 L53 41 L50 46 Z" fill="#FF8F00" />

        {/* 脚 */}
        <line x1="44" y1="85" x2="40" y2="93" stroke="#FF8F00" strokeWidth="2" strokeLinecap="round" />
        <line x1="56" y1="85" x2="60" y2="93" stroke="#FF8F00" strokeWidth="2" strokeLinecap="round" />
        <line x1="40" y1="93" x2="36" y2="93" stroke="#FF8F00" strokeWidth="2" />
        <line x1="60" y1="93" x2="64" y2="93" stroke="#FF8F00" strokeWidth="2" />

        {/* 哈欠动作：张大的嘴 */}
        {action === 'yawn' && (
          <ellipse cx="50" cy="44" rx="5" ry="4" fill="#BF360C" />
        )}

        {/* 担心：眉毛 */}
        {isWorried && (
          <>
            <path d="M39 28 Q43 25 46 28" stroke="#555" strokeWidth="1.5" fill="none" />
            <path d="M54 28 Q57 25 61 28" stroke="#555" strokeWidth="1.5" fill="none" />
          </>
        )}
      </svg>
    </div>
  );
};

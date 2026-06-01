// ─────────────────────────────────────────────
// PetSprite — 小鸟帧动画组件
//
// 渲染策略（与 legacy/electron-prototype/pet.html 对齐）：
//   Canvas 模式：检测到 public/sprites/动作N/frame_01.png 可加载时启用，
//                运行 requestAnimationFrame 循环，按帧绘制 PNG 序列帧。
//   SVG 模式：PNG 不存在时的回落方案，使用内联 SVG 占位动画。
//
// 序列帧资源放置路径：
//   public/sprites/动作1/frame_01.png … frame_06.png
//   public/sprites/动作6/frame_01.png … frame_05.png  ← 默认待机
//   （共7组，详见 legacy/electron-prototype/animations/README.md）
// ─────────────────────────────────────────────

import React, { useEffect, useRef, useState } from 'react';
import type { PetConfig } from '@health-buddy/shared-types';
import type { PetAction } from '../store/petStore';

// ── 序列帧配置（与 pet.html ACTION_CONFIG 一致） ──
const SPRITE_CONFIG: Record<number, { frames: number; fps: number; name: string }> = {
  1: { frames: 6, fps: 10, name: '提示' },
  2: { frames: 7, fps: 10, name: '聊天' },
  3: { frames: 6, fps: 10, name: '伸懒腰' },
  4: { frames: 7, fps: 8,  name: '打哈欠' },
  5: { frames: 5, fps: 6,  name: '睡觉' },
  6: { frames: 5, fps: 8,  name: '默认待机' },
  7: { frames: 5, fps: 8,  name: '开心' },
};

// PetAction → 精灵动作编号
const ACTION_TO_SPRITE: Record<PetAction, number> = {
  idle:    6,
  happy:   7,
  yawn:    4,
  stretch: 3,
  worried: 1,
  sleep:   5,
};

// ── SVG 占位颜色表 ──
const FEATHER_COLORS: Record<string, string> = {
  yellow: '#FFD54F',
  blue:   '#42A5F5',
  green:  '#66BB6A',
  white:  '#FAFAFA',
  brown:  '#8D6E63',
  orange: '#FFA726',
};

// ─────────────────────────────────────────────
// 主组件
// ─────────────────────────────────────────────

interface Props {
  config: PetConfig;
  action: PetAction;
  size?: number;
}

type RenderMode = 'detecting' | 'canvas' | 'svg';

export const PetSprite: React.FC<Props> = ({ config, action, size = 120 }) => {
  const [mode, setMode] = useState<RenderMode>('detecting');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ── Canvas 序列帧状态（持久化到 ref，避免闭包问题） ──
  const spriteRef = useRef({
    frames:       {} as Record<number, HTMLImageElement[]>,
    currentAction: ACTION_TO_SPRITE[action],
    currentFrame:  0,
    lastFrameTime: 0,
    animId:        0,
    loaded:        false,
  });

  // ── 检测 PNG 是否存在（用 frame_01 探测） ──
  useEffect(() => {
    const img = new Image();
    img.src = `sprites/动作6/frame_01.png`;
    img.onload  = () => setMode('canvas');
    img.onerror = () => setMode('svg');
  }, []);

  // ── Canvas 模式：预加载全部帧 ──
  useEffect(() => {
    if (mode !== 'canvas') return;
    const sp = spriteRef.current;

    let cancelled = false;
    async function preload() {
      const loads: Promise<void>[] = [];
      for (let a = 1; a <= 7; a++) {
        sp.frames[a] = [];
        const cfg = SPRITE_CONFIG[a];
        for (let i = 1; i <= cfg.frames; i++) {
          const img = new Image();
          const num = String(i).padStart(2, '0');
          img.src = `sprites/动作${a}/frame_${num}.png`;
          sp.frames[a].push(img);
          loads.push(new Promise<void>((res) => {
            img.onload  = () => res();
            img.onerror = () => res(); // 单帧缺失不阻塞
          }));
        }
      }
      await Promise.all(loads);
      if (!cancelled) sp.loaded = true;
    }

    void preload();
    return () => { cancelled = true; };
  }, [mode]);

  // ── Canvas 模式：动作切换 ──
  useEffect(() => {
    if (mode !== 'canvas') return;
    spriteRef.current.currentAction = ACTION_TO_SPRITE[action];
    spriteRef.current.currentFrame  = 0;
  }, [action, mode]);

  // ── Canvas 模式：rAF 动画循环 ──
  useEffect(() => {
    if (mode !== 'canvas') return;
    const sp = spriteRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function drawFrame() {
      if (!ctx || !canvas) return;
      const actionFrames = sp.frames[sp.currentAction];
      if (!actionFrames?.length) return;
      const img = actionFrames[sp.currentFrame];
      if (!img?.complete) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const scale = Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      ctx.drawImage(img, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh);
    }

    function loop(ts: number) {
      if (!sp.lastFrameTime) sp.lastFrameTime = ts;
      const cfg = SPRITE_CONFIG[sp.currentAction];
      if (ts - sp.lastFrameTime >= 1000 / cfg.fps) {
        sp.currentFrame = (sp.currentFrame + 1) % cfg.frames;
        sp.lastFrameTime = ts;
        if (sp.loaded) drawFrame();
      }
      sp.animId = requestAnimationFrame(loop);
    }

    sp.animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(sp.animId);
  }, [mode]);

  // ── 检测中：占位 ──
  if (mode === 'detecting') {
    return <div style={{ width: size, height: size }} className="flex items-center justify-center">
      <span style={{ fontSize: size * 0.4 }}>🐤</span>
    </div>;
  }

  // ── Canvas 模式渲染 ──
  if (mode === 'canvas') {
    return (
      <div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
        title={SPRITE_CONFIG[ACTION_TO_SPRITE[action]]?.name}
      >
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          style={{ imageRendering: 'pixelated', display: 'block' }}
        />
      </div>
    );
  }

  // ── SVG 回落模式 ──
  return <SvgFallback config={config} action={action} size={size} />;
};

// ─────────────────────────────────────────────
// SVG 占位（Canvas 资源不可用时的回落）
// ─────────────────────────────────────────────

const SvgFallback: React.FC<Props> = ({ config, action, size }) => {
  const bodyColor = FEATHER_COLORS[config.featherColor] ?? '#FFD54F';
  const wingRef = useRef<SVGPathElement>(null);

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
    >
      <style>{`
        @keyframes wingFlap {
          0%   { transform: rotate(0deg); }
          50%  { transform: rotate(-20deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes petBob {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-6px); }
        }
        @keyframes petWorry {
          0%, 100% { transform: rotate(0deg); }
          25%      { transform: rotate(-4deg); }
          75%      { transform: rotate(4deg); }
        }
        .pet-bob   { animation: petBob   2s ease-in-out infinite; }
        .pet-worry { animation: petWorry 0.5s ease-in-out 4; }
      `}</style>

      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className={isWorried ? 'pet-worry' : 'pet-bob'}
      >
        {/* 尾巴 */}
        <ellipse cx="50" cy="82" rx="14" ry="7" fill={bodyColor} opacity="0.85" />
        {/* 身体 */}
        <ellipse cx="50" cy="60" rx="22" ry="26" fill={bodyColor} />
        {/* 翅膀 */}
        <path ref={wingRef} d="M28 58 Q18 50 22 38 Q30 52 36 58 Z"
          fill={bodyColor} opacity="0.9" style={{ transformOrigin: '32px 58px' }} />
        <path d="M72 58 Q82 50 78 38 Q70 52 64 58 Z" fill={bodyColor} opacity="0.9" />
        {/* 头部 */}
        <circle cx="50" cy="36" r="20" fill={bodyColor} />
        {/* 凤冠（部分种类） */}
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
        {/* 哈欠：张大的嘴 */}
        {action === 'yawn' && <ellipse cx="50" cy="44" rx="5" ry="4" fill="#BF360C" />}
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

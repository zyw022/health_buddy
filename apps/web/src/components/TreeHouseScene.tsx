// ─────────────────────────────────────────────
// TreeHouseScene — 树屋 SVG 场景（开场动画）
//
// 视觉设计来源：legacy/electron-prototype/treehouse.html
//   - 深色森林背景 + 萤火虫效果（entry 屏幕入场氛围）
//   - 树屋 SVG：坡屋顶、门开合 3D 动画、窗户暖光、烟囱烟雾
// ─────────────────────────────────────────────

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface Props {
  doorOpen: boolean;
  onDoorClick: () => void;
}

// 萤火虫配置（来自 treehouse.html .firefly 定义）
const FIREFLY_COUNT = 8;

export const TreeHouseScene: React.FC<Props> = ({ doorOpen, onDoorClick }) => {
  // 用 useMemo 固定随机值，避免每次渲染闪烁
  const stars = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      size: Math.random() * 2 + 1,
      top:  Math.random() * 55,
      left: Math.random() * 100,
      opacity: Math.random() * 0.6 + 0.3,
      duration: 2 + Math.random() * 3,
      delay: Math.random() * 3,
    })), []);

  const fireflies = useMemo(() =>
    Array.from({ length: FIREFLY_COUNT }, (_, i) => ({
      id: i,
      top:  15 + Math.random() * 55,
      left: 5  + Math.random() * 90,
      delay: Math.random() * 4,
      duration: 3 + Math.random() * 2,
      tx: (Math.random() - 0.5) * 60,  // x 偏移
      ty: -(Math.random() * 40 + 15),  // y 偏移（向上）
    })), []);

  return (
    <div className="relative w-full h-full flex items-end justify-center select-none overflow-hidden">
      {/* ── 深色森林背景（来自 treehouse.html .entry-bg） ── */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 70%, #1B3A1A 0%, #0D1F0D 60%, #050D05 100%)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
      />

      {/* ── 星空 ── */}
      <div className="absolute inset-0 overflow-hidden">
        {stars.map((s) => (
          <motion.div
            key={s.id}
            className="absolute rounded-full bg-white"
            style={{
              width: s.size,
              height: s.size,
              top: `${s.top}%`,
              left: `${s.left}%`,
              opacity: s.opacity,
            }}
            animate={{ opacity: [s.opacity * 0.5, s.opacity, s.opacity * 0.5] }}
            transition={{ duration: s.duration, repeat: Infinity, delay: s.delay }}
          />
        ))}
      </div>

      {/* ── 萤火虫（来自 treehouse.html .firefly） ── */}
      {fireflies.map((f) => (
        <motion.div
          key={f.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 4, height: 4,
            top: `${f.top}%`,
            left: `${f.left}%`,
            background: '#FFE082',
            boxShadow: '0 0 8px 2px rgba(255,224,130,0.6)',
            zIndex: 1,
          }}
          animate={{
            x:       [0, f.tx * 0.3, f.tx * 0.7, f.tx],
            y:       [0, f.ty * 0.4, f.ty * 0.7, f.ty],
            opacity: [0.3, 0.8, 0.4, 0.7, 0.3],
          }}
          transition={{
            duration: f.duration,
            repeat: Infinity,
            delay: f.delay,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* ── 树屋 SVG ── */}
      <svg
        viewBox="0 0 400 500"
        className="relative z-10"
        style={{
          width: 'min(380px, 90vw)',
          filter: 'drop-shadow(0 0 30px rgba(255,200,80,0.3))',
        }}
      >
        {/* 大树树干 */}
        <rect x="170" y="340" width="60" height="160" rx="8"
          fill="var(--wood-dark, #5D4037)" />

        {/* 树枝 */}
        <path d="M185 380 Q120 350 100 310" stroke="var(--wood-dark,#5D4037)"
          strokeWidth="16" fill="none" strokeLinecap="round" />
        <path d="M215 380 Q280 350 300 310" stroke="var(--wood-dark,#5D4037)"
          strokeWidth="16" fill="none" strokeLinecap="round" />

        {/* 树叶（分层，来自 treehouse.html canopy 色调） */}
        <circle cx="90"  cy="300" r="55" fill="var(--canopy-green-dark, #388E3C)" />
        <circle cx="110" cy="280" r="45" fill="var(--canopy-green, #43A047)" />
        <circle cx="310" cy="300" r="55" fill="var(--canopy-green-dark, #388E3C)" />
        <circle cx="290" cy="280" r="45" fill="var(--canopy-green, #43A047)" />
        <circle cx="200" cy="260" r="70" fill="#2E7D32" />
        <circle cx="180" cy="240" r="55" fill="var(--canopy-green-dark, #388E3C)" />
        <circle cx="220" cy="245" r="50" fill="var(--canopy-green, #43A047)" />

        {/* 树屋平台 */}
        <rect x="90" y="330" width="220" height="20" rx="6"
          fill="var(--trunk-brown, #6D4C41)" />

        {/* 树屋主体 */}
        <rect x="105" y="220" width="190" height="115" rx="6"
          fill="var(--wood-light, #8D6E63)" />

        {/* 坡屋顶（来自 treehouse.html entry-roof） */}
        <path d="M80 225 L200 140 L320 225 Z"
          fill="var(--wood-dark, #5D4037)" />
        <path d="M80 225 L200 140 L260 192"
          fill="var(--trunk-brown, #6D4C41)" />

        {/* 烟囱 */}
        <rect x="235" y="150" width="22" height="45" rx="3"
          fill="var(--bark-dark, #4E342E)" />
        {/* 烟雾动画 */}
        <motion.ellipse
          cx="246" cy="142" rx="8" ry="5"
          fill="rgba(200,200,200,0.5)"
          animate={{ y: [-5, -15, -25], opacity: [0.5, 0.3, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
        />

        {/* 窗户左 — 暖光效果 */}
        <rect x="120" y="240" width="50" height="50" rx="4" fill="#FFF8E1" />
        <rect x="120" y="240" width="50" height="50" rx="4" fill="none"
          stroke="var(--wood-dark,#5D4037)" strokeWidth="3" />
        <line x1="145" y1="240" x2="145" y2="290" stroke="var(--wood-light,#8D6E63)" strokeWidth="2" />
        <line x1="120" y1="265" x2="170" y2="265" stroke="var(--wood-light,#8D6E63)" strokeWidth="2" />
        <rect x="121" y="241" width="48" height="48" rx="3"
          fill="rgba(255,230,100,0.35)" />

        {/* 窗户右 */}
        <rect x="230" y="240" width="50" height="50" rx="4" fill="#FFF8E1" />
        <rect x="230" y="240" width="50" height="50" rx="4" fill="none"
          stroke="var(--wood-dark,#5D4037)" strokeWidth="3" />
        <line x1="255" y1="240" x2="255" y2="290" stroke="var(--wood-light,#8D6E63)" strokeWidth="2" />
        <line x1="230" y1="265" x2="280" y2="265" stroke="var(--wood-light,#8D6E63)" strokeWidth="2" />
        <rect x="231" y="241" width="48" height="48" rx="3"
          fill="rgba(255,230,100,0.35)" />

        {/* 门框 */}
        <rect x="175" y="285" width="50" height="50" rx="4"
          fill="var(--bark-dark, #4E342E)" />

        {/* 门（3D 开合动画，来自 treehouse.html .entry-door） */}
        <motion.g
          style={{ transformOrigin: '175px 310px' }}
          animate={{ rotateY: doorOpen ? -85 : 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <rect
            x="175" y="285" width="50" height="50" rx="4"
            fill="var(--wood-light, #A1887F)"
            className="cursor-pointer"
            onClick={onDoorClick}
          />
          {/* 门把手（来自 treehouse.html .door-knob） */}
          <circle cx="216" cy="312" r="4"
            fill="#FFD54F"
            style={{ filter: 'drop-shadow(0 0 4px rgba(255,180,0,0.6))' }}
          />
          {/* 门装饰 */}
          <rect x="181" y="291" width="16" height="22" rx="2"
            fill="none" stroke="var(--wood-dark,#5D4037)" strokeWidth="1.5" />
          <rect x="203" y="291" width="16" height="22" rx="2"
            fill="none" stroke="var(--wood-dark,#5D4037)" strokeWidth="1.5" />
        </motion.g>

        {/* 门打开后的暖光（来自 treehouse.html .door-glow） */}
        {doorOpen && (
          <motion.rect
            x="175" y="285" width="50" height="50" rx="4"
            fill="rgba(255,220,140,0.75)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          />
        )}

        {/* 台阶 */}
        <rect x="170" y="332" width="60" height="8" rx="2"
          fill="var(--trunk-brown, #6D4C41)" />
        <rect x="165" y="338" width="70" height="8" rx="2"
          fill="var(--wood-dark, #5D4037)" />

        {/* 挂灯（bobbing 动画） */}
        <line x1="200" y1="135" x2="200" y2="155" stroke="var(--wood-dark,#5D4037)" strokeWidth="2" />
        <motion.g
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <rect x="193" y="155" width="14" height="18" rx="3" fill="#FFD54F" />
          <motion.ellipse
            cx="200" cy="164" rx="12" ry="12"
            fill="rgba(255,220,80,0.25)"
            animate={{ rx: [12, 16, 12], ry: [12, 16, 12] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.g>

        {/* 爬藤装饰 */}
        <path d="M105 230 Q100 250 108 270 Q115 255 110 240 Z"
          fill="var(--canopy-green, #4CAF50)" opacity="0.7" />
        <path d="M295 235 Q300 255 292 275 Q285 260 290 245 Z"
          fill="var(--canopy-green, #4CAF50)" opacity="0.7" />
      </svg>

      {/* 点击提示（门未打开时） */}
      {!doorOpen && (
        <motion.div
          className="absolute z-20 text-white/80 text-sm text-center cursor-pointer"
          style={{ bottom: '18%' }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          onClick={onDoorClick}
        >
          点击门，进入树屋
        </motion.div>
      )}
    </div>
  );
};

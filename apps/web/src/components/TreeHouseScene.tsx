// ─────────────────────────────────────────────
// TreeHouseScene — 树屋 SVG 场景（开场动画）
// ─────────────────────────────────────────────

import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  doorOpen: boolean;
  onDoorClick: () => void;
}

export const TreeHouseScene: React.FC<Props> = ({ doorOpen, onDoorClick }) => {
  return (
    <div className="relative w-full h-full flex items-end justify-center select-none">
      {/* 背景星空 */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 2 + 1,
              height: Math.random() * 2 + 1,
              top: `${Math.random() * 60}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.7 + 0.3,
              animation: `float ${2 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* 树屋 SVG */}
      <svg
        viewBox="0 0 400 500"
        className="relative z-10"
        style={{ width: 'min(380px, 90vw)', filter: 'drop-shadow(0 0 30px rgba(255,200,80,0.3))' }}
      >
        {/* 大树树干 */}
        <rect x="170" y="340" width="60" height="160" rx="8" fill="#5D4037" />

        {/* 树枝左 */}
        <path d="M185 380 Q120 350 100 310" stroke="#5D4037" strokeWidth="16" fill="none" strokeLinecap="round" />
        {/* 树枝右 */}
        <path d="M215 380 Q280 350 300 310" stroke="#5D4037" strokeWidth="16" fill="none" strokeLinecap="round" />

        {/* 树叶左 */}
        <circle cx="90" cy="300" r="55" fill="#388E3C" />
        <circle cx="110" cy="280" r="45" fill="#43A047" />

        {/* 树叶右 */}
        <circle cx="310" cy="300" r="55" fill="#388E3C" />
        <circle cx="290" cy="280" r="45" fill="#43A047" />

        {/* 树叶顶部 */}
        <circle cx="200" cy="260" r="70" fill="#2E7D32" />
        <circle cx="180" cy="240" r="55" fill="#388E3C" />
        <circle cx="220" cy="245" r="50" fill="#43A047" />

        {/* 树屋平台 */}
        <rect x="90" y="330" width="220" height="20" rx="6" fill="#6D4C41" />

        {/* 树屋主体 */}
        <rect x="105" y="220" width="190" height="115" rx="6" fill="#8D6E63" />

        {/* 屋顶（坡屋顶） */}
        <path d="M80 225 L200 140 L320 225 Z" fill="#5D4037" />
        {/* 屋顶高光 */}
        <path d="M80 225 L200 140 L260 192" fill="#6D4C41" />

        {/* 屋顶装饰瓦片线 */}
        {[150, 162, 174, 186, 198, 210, 222].map((y) => (
          <line key={y} x1="80" y1={y} x2="320" y2={y} stroke="#4E342E" strokeWidth="1" opacity="0.4"
            style={{ clipPath: `polygon(0 ${y - 140}px, 240px ${y - 140}px, 120px 0, 0 0)` }}
          />
        ))}

        {/* 烟囱 */}
        <rect x="235" y="150" width="22" height="45" rx="3" fill="#4E342E" />
        {/* 烟 */}
        <motion.ellipse
          cx="246" cy="142"
          rx="8" ry="5"
          fill="rgba(200,200,200,0.5)"
          animate={{ y: [-5, -15, -25], opacity: [0.5, 0.3, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
        />

        {/* 窗户左 */}
        <rect x="120" y="240" width="50" height="50" rx="4" fill="#FFF8E1" />
        <rect x="120" y="240" width="50" height="50" rx="4" fill="none" stroke="#5D4037" strokeWidth="3" />
        {/* 窗格 */}
        <line x1="145" y1="240" x2="145" y2="290" stroke="#8D6E63" strokeWidth="2" />
        <line x1="120" y1="265" x2="170" y2="265" stroke="#8D6E63" strokeWidth="2" />
        {/* 窗户暖光 */}
        <rect x="121" y="241" width="48" height="48" rx="3" fill="rgba(255,230,100,0.35)" />

        {/* 窗户右 */}
        <rect x="230" y="240" width="50" height="50" rx="4" fill="#FFF8E1" />
        <rect x="230" y="240" width="50" height="50" rx="4" fill="none" stroke="#5D4037" strokeWidth="3" />
        <line x1="255" y1="240" x2="255" y2="290" stroke="#8D6E63" strokeWidth="2" />
        <line x1="230" y1="265" x2="280" y2="265" stroke="#8D6E63" strokeWidth="2" />
        <rect x="231" y="241" width="48" height="48" rx="3" fill="rgba(255,230,100,0.35)" />

        {/* 门框 */}
        <rect x="175" y="285" width="50" height="50" rx="4" fill="#4E342E" />

        {/* 门（可交互，带开合动画） */}
        <motion.g
          style={{ transformOrigin: '175px 310px' }}
          animate={{ rotateY: doorOpen ? -100 : 0 }}
          transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
        >
          <rect
            x="175"
            y="285"
            width="50"
            height="50"
            rx="4"
            fill="#6D4C41"
            className="cursor-pointer"
            onClick={onDoorClick}
          />
          {/* 门把手 */}
          <circle cx="216" cy="312" r="3.5" fill="#FFD54F" />
          {/* 门装饰 */}
          <rect x="181" y="291" width="16" height="22" rx="2" fill="none" stroke="#5D4037" strokeWidth="1.5" />
          <rect x="203" y="291" width="16" height="22" rx="2" fill="none" stroke="#5D4037" strokeWidth="1.5" />
        </motion.g>

        {/* 门框内光（门打开时显示） */}
        {doorOpen && (
          <motion.rect
            x="175" y="285" width="50" height="50"
            fill="rgba(255,230,100,0.8)"
            rx="4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          />
        )}

        {/* 台阶 */}
        <rect x="170" y="332" width="60" height="8" rx="2" fill="#6D4C41" />
        <rect x="165" y="338" width="70" height="8" rx="2" fill="#5D4037" />

        {/* 挂灯 */}
        <line x1="200" y1="135" x2="200" y2="155" stroke="#5D4037" strokeWidth="2" />
        <motion.g
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <rect x="193" y="155" width="14" height="18" rx="3" fill="#FFD54F" />
          <motion.ellipse
            cx="200" cy="164"
            rx="12" ry="12"
            fill="rgba(255,220,80,0.25)"
            animate={{ rx: [12, 16, 12], ry: [12, 16, 12] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.g>

        {/* 爬藤装饰 */}
        <path d="M105 230 Q100 250 108 270 Q115 255 110 240 Z" fill="#4CAF50" opacity="0.7" />
        <path d="M295 235 Q300 255 292 275 Q285 260 290 245 Z" fill="#4CAF50" opacity="0.7" />
      </svg>

      {/* 点击提示（门未打开时） */}
      {!doorOpen && (
        <motion.div
          className="absolute z-20 text-white/80 text-sm text-center"
          style={{ bottom: '18%' }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
          onClick={onDoorClick}
        >
          点击门，进入树屋
        </motion.div>
      )}
    </div>
  );
};

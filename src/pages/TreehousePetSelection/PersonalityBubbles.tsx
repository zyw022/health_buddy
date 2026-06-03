import React from 'react'
import { motion } from 'framer-motion'
import { PERSONALITY_OPTIONS, PERSONALITY_BUBBLE_LAYOUT } from './config'
import type { Personality } from '../../store/types'

interface Props {
  selected: Personality | null
  onSelect: (p: Personality) => void
}

export const PersonalityBubbles: React.FC<Props> = ({ selected, onSelect }) => {
  return (
    <div className="absolute inset-0 z-[25] pointer-events-none [&_button]:pointer-events-auto">
      {PERSONALITY_OPTIONS.map((p, i) => {
        const layout = PERSONALITY_BUBBLE_LAYOUT[i]
        return (
          <motion.button
            key={p.id}
            type="button"
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: 1,
              y: [0, -6, 0],
            }}
            transition={{
              scale: { delay: i * 0.1, type: 'spring', stiffness: 380, damping: 20 },
              opacity: { delay: i * 0.1 },
              y: { repeat: Infinity, duration: 2.8 + i * 0.3, ease: 'easeInOut' },
            }}
            onClick={() => onSelect(p.id)}
            className="absolute pointer-events-auto text-left max-w-[140px]"
            style={{
              left: `${layout.x}%`,
              top: `${layout.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div
              className="rounded-2xl px-3 py-2.5 border-2 transition-all cursor-pointer"
              style={{
                background: selected === p.id ? `${p.color}33` : 'rgba(15,18,35,0.88)',
                borderColor: selected === p.id ? p.color : 'rgba(255,255,255,0.2)',
                boxShadow: selected === p.id
                  ? `0 0 24px ${p.color}55`
                  : '0 8px 24px rgba(0,0,0,0.35)',
              }}
            >
              <div className="text-white text-sm font-medium">{p.label}</div>
              <div className="text-white/50 text-xs mt-0.5">{p.desc}</div>
            </div>
            {/* Bubble tail */}
            <div
              className="mx-auto mt-1"
              style={{
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: `7px solid ${selected === p.id ? `${p.color}33` : 'rgba(15,18,35,0.88)'}`,
              }}
            />
          </motion.button>
        )
      })}
    </div>
  )
}

import React from 'react'
import { motion } from 'framer-motion'
import { PERSONALITY_OPTIONS } from './config'
import type { Personality } from '../../store/types'

interface Props {
  selected: Personality | null
  onSelect: (p: Personality) => void
}

export const PersonalityBubbles: React.FC<Props> = ({ selected, onSelect }) => {
  return (
    // Panel anchored at the bottom, pet sprite sits in the middle above it
    <div className="absolute inset-0 z-[25] flex flex-col items-center justify-end pointer-events-none pb-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        className="pointer-events-auto mx-4 w-full max-w-[300px]"
        style={{
          background: 'rgba(10, 13, 30, 0.90)',
          border: '3px solid rgba(0,0,0,0.85)',
          outline: '1.5px solid rgba(255,255,255,0.14)',
          outlineOffset: '-4px',
          boxShadow: '4px 4px 0 rgba(0,0,0,0.70)',
          imageRendering: 'pixelated',
        }}
      >
        {/* Header */}
        <div
          className="px-4 py-2"
          style={{
            borderBottom: '2px solid rgba(255,255,255,0.10)',
            background: 'rgba(255,255,255,0.04)',
          }}
        >
          <p className="px-label text-white/60 text-center" style={{ fontSize: 8 }}>
            选择性格
          </p>
        </div>

        {/* 2×2 Grid */}
        <div className="grid grid-cols-2 gap-2 p-3">
          {PERSONALITY_OPTIONS.map((p, i) => {
            const isSelected = selected === p.id
            return (
              <motion.button
                key={p.id}
                type="button"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.07, type: 'spring', stiffness: 360, damping: 22 }}
                whileTap={{ scale: 0.95, x: 1, y: 1 }}
                onClick={() => onSelect(p.id)}
                className="flex flex-col items-start px-3 py-2.5 text-left"
                style={{
                  background: isSelected ? `${p.color}22` : 'rgba(16,20,44,0.85)',
                  border: `2px solid ${isSelected ? p.color : 'rgba(255,255,255,0.18)'}`,
                  boxShadow: isSelected
                    ? `2px 2px 0 rgba(0,0,0,0.70), 0 0 16px ${p.color}44`
                    : '2px 2px 0 rgba(0,0,0,0.60)',
                  imageRendering: 'pixelated',
                  cursor: 'pointer',
                  transition: 'border-color 0.1s, box-shadow 0.1s, background 0.1s',
                }}
              >
                {/* Color accent dot */}
                <div
                  className="mb-1.5"
                  style={{
                    width: 8,
                    height: 8,
                    background: p.color,
                    border: '1px solid rgba(0,0,0,0.50)',
                    boxShadow: `1px 1px 0 rgba(0,0,0,0.60)`,
                    imageRendering: 'pixelated',
                  }}
                />
                <p className="px-label text-white/90 leading-none" style={{ fontSize: 9 }}>
                  {p.label}
                </p>
                <p className="px-label text-white/40 mt-1 leading-snug" style={{ fontSize: 7 }}>
                  {p.desc}
                </p>
              </motion.button>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}

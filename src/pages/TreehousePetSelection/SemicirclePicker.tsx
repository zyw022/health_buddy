import React from 'react'
import { motion } from 'framer-motion'
import { COLOR_OPTIONS, GENDER_OPTIONS } from './config'
import type { FeatherColor, PetGender } from '../../store/types'

interface Props {
  anchorX:      number   // unused — panel is always bottom-centered
  anchorY:      number
  gender:       PetGender | null
  featherColor: FeatherColor | null
  onGender:     (g: PetGender) => void
  onColor:      (c: FeatherColor) => void
  onConfirm:    () => void
}

// Pixel border style shared by both selectors
const pixelBorder = (selected: boolean, accentColor?: string): React.CSSProperties => ({
  border: `2px solid ${selected ? (accentColor ?? 'rgba(140,200,255,0.90)') : 'rgba(255,255,255,0.28)'}`,
  boxShadow: selected
    ? `2px 2px 0 rgba(0,0,0,0.70), 0 0 12px ${accentColor ?? 'rgba(140,200,255,0.40)'}55`
    : '2px 2px 0 rgba(0,0,0,0.60)',
  background: selected ? (accentColor ? `${accentColor}22` : 'rgba(100,160,255,0.18)') : 'rgba(14,17,38,0.88)',
  imageRendering: 'pixelated',
  cursor: 'pointer',
  transition: 'border-color 0.1s, box-shadow 0.1s, background 0.1s',
})

export const SemicirclePicker: React.FC<Props> = ({
  gender,
  featherColor,
  onGender,
  onColor,
  onConfirm,
}) => {
  const ready = gender !== null && featherColor !== null

  return (
    // Positioned in the lower portion of the screen, below the pet sprite
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-end pointer-events-none pb-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        className="pointer-events-auto mx-4 w-full max-w-[280px]"
        style={{
          background: 'rgba(10, 13, 30, 0.90)',
          border: '3px solid rgba(0,0,0,0.85)',
          outline: '1.5px solid rgba(255,255,255,0.15)',
          outlineOffset: '-4px',
          boxShadow: '4px 4px 0 rgba(0,0,0,0.70)',
          imageRendering: 'pixelated',
        }}
      >
        {/* ── Panel header ──────────────────────────────── */}
        <div
          className="px-4 py-2"
          style={{
            borderBottom: '2px solid rgba(255,255,255,0.10)',
            background: 'rgba(255,255,255,0.04)',
          }}
        >
          <p className="px-label text-white/60 text-center" style={{ fontSize: 8 }}>
            选择性别与毛色
          </p>
        </div>

        <div className="px-4 py-3 space-y-3">
          {/* ── Gender row ───────────────────────────────── */}
          <div>
            <p className="px-label text-white/40 mb-2" style={{ fontSize: 7 }}>性别</p>
            <div className="flex gap-2">
              {GENDER_OPTIONS.map((g, i) => (
                <motion.button
                  key={g.id}
                  type="button"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.06, type: 'spring', stiffness: 400, damping: 22 }}
                  whileTap={{ scale: 0.93, x: 1, y: 1 }}
                  onClick={() => onGender(g.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2"
                  style={pixelBorder(gender === g.id, '#7dd3fc')}
                >
                  <span className="text-white/90" style={{ fontSize: 16, lineHeight: 1 }}>{g.symbol}</span>
                  <span className="px-label text-white/80" style={{ fontSize: 8 }}>{g.label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* ── Color row ────────────────────────────────── */}
          <div>
            <p className="px-label text-white/40 mb-2" style={{ fontSize: 7 }}>毛色</p>
            <div className="grid grid-cols-6 gap-1.5">
              {COLOR_OPTIONS.map((c, i) => (
                <motion.button
                  key={c.id}
                  type="button"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.08 + i * 0.04, type: 'spring', stiffness: 400, damping: 22 }}
                  whileTap={{ scale: 0.90, x: 1, y: 1 }}
                  onClick={() => onColor(c.id)}
                  title={c.label}
                  className="aspect-square"
                  style={{
                    background: c.hex,
                    border: `2px solid ${featherColor === c.id ? '#fff' : 'rgba(0,0,0,0.60)'}`,
                    boxShadow: featherColor === c.id
                      ? `0 0 0 1.5px ${c.hex}, 2px 2px 0 rgba(0,0,0,0.70)`
                      : '2px 2px 0 rgba(0,0,0,0.60)',
                    imageRendering: 'pixelated',
                    cursor: 'pointer',
                    transition: 'border-color 0.1s, box-shadow 0.1s',
                  }}
                />
              ))}
            </div>
          </div>

          {/* ── Confirm button ───────────────────────────── */}
          <motion.button
            type="button"
            animate={{ opacity: ready ? 1 : 0.35 }}
            whileTap={ready ? { scale: 0.96, x: 2, y: 2 } : {}}
            disabled={!ready}
            onClick={onConfirm}
            className="w-full py-2 px-btn px-btn-accent px-label"
            style={{
              fontSize: 9,
              opacity: ready ? 1 : 0.35,
              cursor: ready ? 'pointer' : 'default',
            }}
          >
            {ready ? '选好了 →' : '请选择性别和毛色'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}

import React from 'react'
import { motion } from 'framer-motion'
import { COLOR_OPTIONS, GENDER_OPTIONS } from './config'
import type { FeatherColor, PetGender } from '../../store/types'

interface Props {
  anchorX:      number   // percent
  anchorY:      number
  gender:       PetGender | null
  featherColor: FeatherColor | null
  onGender:     (g: PetGender) => void
  onColor:      (c: FeatherColor) => void
  onConfirm:    () => void
}

function arcPosition(
  index: number,
  total: number,
  radiusPx: number,
  centerX: number,
  centerY: number,
  startDeg: number,
  endDeg: number,
) {
  const t = total <= 1 ? 0.5 : index / (total - 1)
  const deg = startDeg + t * (endDeg - startDeg)
  const rad = (deg * Math.PI) / 180
  return {
    left: centerX + radiusPx * Math.cos(rad),
    top:  centerY + radiusPx * Math.sin(rad),
  }
}

export const SemicirclePicker: React.FC<Props> = ({
  anchorX,
  anchorY,
  gender,
  featherColor,
  onGender,
  onColor,
  onConfirm,
}) => {
  const ready = gender !== null && featherColor !== null

  return (
    <div className="absolute inset-0 z-20 pointer-events-none">
      <div
        className="absolute pointer-events-auto"
        style={{
          left: `${anchorX}%`,
          top: `${anchorY}%`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        {/* Gender — inner semicircle (top arc) */}
        {GENDER_OPTIONS.map((g, i) => {
          const pos = arcPosition(i, GENDER_OPTIONS.length, 72, 0, -20, 200, 340)
          return (
            <motion.button
              key={g.id}
              type="button"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.06, type: 'spring', stiffness: 420, damping: 22 }}
              onClick={() => onGender(g.id)}
              className="absolute flex flex-col items-center justify-center w-11 h-11 rounded-full border-2 transition-all"
              style={{
                left: pos.left,
                top: pos.top,
                transform: 'translate(-50%, -50%)',
                borderColor: gender === g.id ? '#7dd3fc' : 'rgba(255,255,255,0.35)',
                background: gender === g.id ? 'rgba(125,211,252,0.25)' : 'rgba(15,18,35,0.85)',
                boxShadow: gender === g.id ? '0 0 16px rgba(125,211,252,0.5)' : '0 4px 12px rgba(0,0,0,0.3)',
              }}
              title={g.label}
            >
              <span className="text-white text-lg leading-none">{g.symbol}</span>
            </motion.button>
          )
        })}

        {/* Colors — outer semicircle */}
        {COLOR_OPTIONS.map((c, i) => {
          const pos = arcPosition(i, COLOR_OPTIONS.length, 118, 0, -24, 195, 345)
          return (
            <motion.button
              key={c.id}
              type="button"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.12 + i * 0.04, type: 'spring', stiffness: 420, damping: 22 }}
              onClick={() => onColor(c.id)}
              className="absolute w-9 h-9 rounded-full border-2 transition-all"
              style={{
                left: pos.left,
                top: pos.top,
                transform: 'translate(-50%, -50%)',
                background: c.hex,
                borderColor: featherColor === c.id ? '#fff' : 'rgba(255,255,255,0.4)',
                boxShadow: featherColor === c.id ? '0 0 14px rgba(255,255,255,0.7)' : '0 2px 8px rgba(0,0,0,0.35)',
              }}
              title={c.label}
            />
          )
        })}

        {ready && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onConfirm}
            className="absolute left-1/2 -translate-x-1/2 top-16 px-4 py-1.5 rounded-full text-xs text-white font-medium pointer-events-auto"
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
              boxShadow: '0 4px 16px rgba(59,130,246,0.45)',
            }}
          >
            选好了 →
          </motion.button>
        )}
      </div>
    </div>
  )
}

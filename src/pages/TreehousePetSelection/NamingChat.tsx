import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { PetSprite } from '../../components/PetSprite'
import type { PetSpecies } from '../../store/types'

interface Props {
  petLabel:    string
  petSpecies?: PetSpecies
  initialName?: string
  saving:      boolean
  onSubmit:    (name: string) => void
  onCancel:    () => void
}

export const NamingChat: React.FC<Props> = ({
  petLabel,
  petSpecies = 'sparrow',
  initialName = '',
  saving,
  onSubmit,
  onCancel,
}) => {
  const [name, setName] = useState(initialName)
  const trimmed   = name.trim()
  const canSubmit = trimmed.length > 0 && !saving

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-40 flex flex-col items-center justify-end pb-10 px-5 pointer-events-auto"
      style={{ background: 'rgba(6,8,20,0.62)' }}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        className="w-full max-w-[310px]"
        style={{
          background: 'rgba(10,13,30,0.95)',
          border: '3px solid rgba(0,0,0,0.88)',
          outline: '1.5px solid rgba(255,255,255,0.15)',
          outlineOffset: '-4px',
          boxShadow: '4px 4px 0 rgba(0,0,0,0.75)',
          imageRendering: 'pixelated',
        }}
      >
        {/* ── Header ─────────────────────────────────────── */}
        <div
          className="flex items-center gap-2 px-3 py-2.5"
          style={{ borderBottom: '2px solid rgba(255,255,255,0.10)' }}
        >
          <div
            style={{
              width: 32, height: 32,
              border: '2px solid rgba(255,255,255,0.30)',
              boxShadow: '2px 2px 0 rgba(0,0,0,0.60)',
              imageRendering: 'pixelated',
              flexShrink: 0,
              overflow: 'hidden',
            }}
          >
            <PetSprite action="happy" species={petSpecies} size={32} />
          </div>
          <div className="min-w-0">
            <p className="px-label text-white/90" style={{ fontSize: 9 }}>{petLabel}</p>
            <p className="px-label text-white/40 mt-0.5" style={{ fontSize: 7 }}>想听听你叫我什么</p>
          </div>
        </div>

        {/* ── Messages ───────────────────────────────────── */}
        <div className="px-3 py-3 space-y-2.5" style={{ minHeight: 90 }}>
          {/* Pet message */}
          <div className="flex items-start gap-2">
            <div
              className="px-3 py-2 flex-1"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '2px solid rgba(255,255,255,0.14)',
                boxShadow: '2px 2px 0 rgba(0,0,0,0.55)',
                imageRendering: 'pixelated',
              }}
            >
              <p className="px-label text-white/80 leading-relaxed" style={{ fontSize: 8 }}>
                嗨～我是你的新伙伴！给我取个名字吧，最多 12 个字哦 ✨
              </p>
            </div>
          </div>

          {/* User reply bubble */}
          {trimmed && (
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex justify-end"
            >
              <div
                className="px-3 py-2 max-w-[75%]"
                style={{
                  background: 'rgba(60,100,220,0.55)',
                  border: '2px solid rgba(120,160,255,0.60)',
                  boxShadow: '2px 2px 0 rgba(0,0,0,0.55)',
                  imageRendering: 'pixelated',
                }}
              >
                <p className="px-label text-white/90" style={{ fontSize: 8 }}>
                  就叫「{trimmed}」吧！
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {/* ── Input row ──────────────────────────────────── */}
        <div
          className="px-3 py-2.5 flex gap-2"
          style={{ borderTop: '2px solid rgba(255,255,255,0.08)' }}
        >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 12))}
            onKeyDown={(e) => { if (e.key === 'Enter' && canSubmit) onSubmit(trimmed) }}
            placeholder="输入名字…"
            maxLength={12}
            autoFocus
            className="flex-1 px-3 py-1.5 text-white placeholder-white/30 outline-none"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '2px solid rgba(255,255,255,0.22)',
              boxShadow: 'inset 1px 1px 0 rgba(0,0,0,0.40)',
              fontFamily: 'var(--font-pixel)',
              fontSize: 9,
              imageRendering: 'pixelated',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(120,180,255,0.70)' }}
            onBlur={(e)  => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)' }}
          />
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => onSubmit(trimmed)}
            className="px-btn px-btn-accent px-label px-3 py-1.5"
            style={{
              fontSize: 9,
              opacity: canSubmit ? 1 : 0.38,
              cursor: canSubmit ? 'pointer' : 'default',
            }}
          >
            {saving ? '…' : '发送'}
          </button>
        </div>

        {/* ── Footer ─────────────────────────────────────── */}
        <div
          className="px-3 py-2 flex justify-between items-center"
          style={{ borderTop: '2px solid rgba(255,255,255,0.06)' }}
        >
          <span className="px-label text-white/30" style={{ fontSize: 7 }}>{name.length}/12</span>
          <button
            type="button"
            onClick={onCancel}
            className="px-label text-white/40 hover:text-white/70 transition-colors"
            style={{ fontSize: 7, background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            ← 返回上一步
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

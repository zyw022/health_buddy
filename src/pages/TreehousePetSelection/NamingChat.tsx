import React, { useState } from 'react'
import { motion } from 'framer-motion'

interface Props {
  petLabel:   string
  initialName?: string
  saving:     boolean
  onSubmit:   (name: string) => void
  onCancel:   () => void
}

export const NamingChat: React.FC<Props> = ({
  petLabel,
  initialName = '',
  saving,
  onSubmit,
  onCancel,
}) => {
  const [name, setName] = useState(initialName)
  const trimmed = name.trim()
  const canSubmit = trimmed.length > 0 && !saving

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-40 flex items-end justify-center pb-16 px-6 pointer-events-auto"
      style={{ background: 'rgba(8,10,22,0.55)' }}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="w-full max-w-md rounded-3xl overflow-hidden"
        style={{
          background: 'rgba(18,22,40,0.95)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Chat header */}
        <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-500/30 flex items-center justify-center text-sm">
            🐦
          </div>
          <div>
            <p className="text-white text-sm font-medium">{petLabel}</p>
            <p className="text-white/40 text-xs">想听听你叫我什么</p>
          </div>
        </div>

        {/* Messages */}
        <div className="px-4 py-4 space-y-3 min-h-[120px]">
          <div className="flex justify-start">
            <div className="bg-white/10 text-white/90 text-sm px-3 py-2 rounded-2xl rounded-bl-sm max-w-[85%]">
              嗨～我是你的新伙伴！给我取个名字吧，最多 12 个字哦 ✨
            </div>
          </div>

          {trimmed && (
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex justify-end"
            >
              <div className="bg-blue-500 text-white text-sm px-3 py-2 rounded-2xl rounded-br-sm max-w-[85%]">
                就叫「{trimmed}」吧！
              </div>
            </motion.div>
          )}
        </div>

        {/* Input bar */}
        <div className="px-4 pb-4 flex gap-2 items-center">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 12))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canSubmit) onSubmit(trimmed)
            }}
            placeholder="输入名字…"
            maxLength={12}
            autoFocus
            className="flex-1 bg-white/8 border border-white/15 rounded-2xl px-4 py-2.5 text-white text-sm outline-none focus:border-blue-400 placeholder-white/30"
          />
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => onSubmit(trimmed)}
            className="px-4 py-2.5 rounded-2xl text-sm font-medium text-white transition-all disabled:opacity-40"
            style={{ background: canSubmit ? '#3b82f6' : 'rgba(255,255,255,0.1)' }}
          >
            {saving ? '…' : '发送'}
          </button>
        </div>

        <div className="px-4 pb-3 flex justify-between items-center">
          <span className="text-white/30 text-xs">{name.length}/12</span>
          <button
            type="button"
            onClick={onCancel}
            className="text-white/40 text-xs hover:text-white/70 transition-colors"
          >
            返回上一步
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

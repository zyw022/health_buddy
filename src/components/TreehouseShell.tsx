import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getElectronAPI } from '../store/petStore'

export type FadePhase = 'in' | 'visible' | 'out'

interface Props {
  children?:          React.ReactNode
  title?:             string
  subtitle?:          string
  footer?:            React.ReactNode
  /** Extra action buttons rendered in the floating bubble (e.g. "更换宠物") */
  actions?:           React.ReactNode
  imageOpacity?:      number
  /** Hide all chrome. Pure image mode for the launch splash. */
  pureImage?:         boolean
  fadePhase?:         FadePhase
  onFadeInComplete?:  () => void
  onFadeOutComplete?: () => void
}

const FADE_DURATION: Record<FadePhase, number> = {
  in:      1.2,
  visible: 0,
  out:     0.9,
}

export const TreehouseShell: React.FC<Props> = ({
  children,
  title,
  subtitle,
  footer,
  actions,
  imageOpacity = 1,
  pureImage    = false,
  fadePhase    = 'visible',
  onFadeInComplete,
  onFadeOutComplete,
}) => {
  const handleClose = () => getElectronAPI()?.closeTreehouse()
  const [hovered, setHovered] = useState(false)

  const targetOpacity = fadePhase === 'out' ? 0 : 1
  const duration      = FADE_DURATION[fadePhase]
  const ease          = fadePhase === 'out' ? 'easeIn' : 'easeOut'

  return (
    <motion.div
      className="w-full h-full relative overflow-hidden"
      style={{
        background: 'transparent',
        // Whole window is draggable
        WebkitAppRegion: pureImage ? 'no-drag' : 'drag',
      }}
      initial={{ opacity: fadePhase === 'in' ? 0 : 1 }}
      animate={{ opacity: targetOpacity }}
      transition={{ duration, ease }}
      onAnimationComplete={() => {
        if (fadePhase === 'in')  onFadeInComplete?.()
        if (fadePhase === 'out') onFadeOutComplete?.()
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Treehouse image — fills the transparent window */}
      <img
        src="materials/treehouse/treehouse.png"
        alt="树屋"
        draggable={false}
        className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
        style={{ opacity: imageOpacity }}
      />

      {/* Floating bubble controls — appear on hover, anchored top-right in the "canopy" area */}
      {!pureImage && (
        <AnimatePresence>
          {hovered && (
            <motion.div
              key="controls"
              initial={{ opacity: 0, y: -6, scale: 0.92 }}
              animate={{ opacity: 1, y: 0,  scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.92 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="absolute top-3 right-3 z-50 flex items-center gap-1.5"
              // Buttons must NOT propagate the window-drag region
              style={{ WebkitAppRegion: 'no-drag' }}
            >
              {/* Title / subtitle pill — shown if provided */}
              {(title || subtitle) && (
                <div
                  className="px-2.5 py-1 rounded-full flex flex-col justify-center leading-tight pointer-events-none select-none"
                  style={{ background: 'rgba(8,10,22,0.70)', backdropFilter: 'blur(6px)' }}
                >
                  {title && (
                    <span className="text-white/90 text-[11px] font-medium">{title}</span>
                  )}
                  {subtitle && (
                    <span className="text-white/45 text-[9px]">{subtitle}</span>
                  )}
                </div>
              )}

              {/* Extra action buttons passed from parent */}
              {actions && (
                <div className="flex items-center gap-1">
                  {actions}
                </div>
              )}

              {/* Close × button */}
              <button
                type="button"
                onClick={handleClose}
                className="w-7 h-7 rounded-full flex items-center justify-center text-white/75 hover:text-white text-sm transition-all"
                style={{ background: 'rgba(8,10,22,0.70)', backdropFilter: 'blur(6px)' }}
                title="关闭树屋"
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Interactive overlays (children) */}
      <div
        className="absolute inset-0 z-[20] pointer-events-none"
        style={{ WebkitAppRegion: 'no-drag' }}
      >
        {children}
      </div>

      {/* Footer */}
      {!pureImage && footer && (
        <div
          className="absolute inset-x-0 bottom-0 z-50 px-3 py-2 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, rgba(8,10,22,0.88), transparent)',
            WebkitAppRegion: 'no-drag',
          }}
        >
          {footer}
        </div>
      )}
    </motion.div>
  )
}

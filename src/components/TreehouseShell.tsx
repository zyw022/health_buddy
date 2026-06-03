import React from 'react'
import { motion } from 'framer-motion'
import { getElectronAPI } from '../store/petStore'

export type FadePhase = 'in' | 'visible' | 'out'

interface Props {
  children?:          React.ReactNode
  title?:             string
  subtitle?:          string
  footer?:            React.ReactNode
  actions?:           React.ReactNode
  imageOpacity?:      number
  /** Hide all chrome (drag bar, title, close). Pure image mode for the launch splash. */
  pureImage?:         boolean
  /** Controls the whole-window fade animation. Default: 'visible' (no animation). */
  fadePhase?:         FadePhase
  onFadeInComplete?:  () => void
  onFadeOutComplete?: () => void
}

const FADE_DURATION: Record<FadePhase, number> = {
  in:      1.2,
  visible: 0,
  out:     0.9,
}

/**
 * Floating treehouse shell.
 * - pureImage=true   → full-bleed image only, all chrome hidden (launch splash)
 * - fadePhase='in'   → fades in from opacity 0 on mount
 * - fadePhase='out'  → fades out to opacity 0 (triggers onFadeOutComplete when done)
 */
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

  const targetOpacity = fadePhase === 'out' ? 0 : 1
  const duration      = FADE_DURATION[fadePhase]
  const ease          = fadePhase === 'out' ? 'easeIn' : 'easeOut'

  return (
    <motion.div
      className="w-full h-full relative overflow-hidden"
      style={{ background: 'transparent' }}
      initial={{ opacity: fadePhase === 'in' ? 0 : 1 }}
      animate={{ opacity: targetOpacity }}
      transition={{ duration, ease }}
      onAnimationComplete={() => {
        if (fadePhase === 'in')  onFadeInComplete?.()
        if (fadePhase === 'out') onFadeOutComplete?.()
      }}
    >
      <img
        src="materials/treehouse/treehouse.png"
        alt="树屋"
        draggable={false}
        className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
        style={{ opacity: imageOpacity }}
      />

      {/* Chrome: drag bar, title, close button — hidden in pureImage mode */}
      {!pureImage && (
        <div
          className="absolute inset-x-0 top-0 z-50 flex items-center gap-2 px-2 py-1.5"
          style={{
            WebkitAppRegion: 'drag',
            background: 'linear-gradient(to bottom, rgba(8,10,22,0.82), rgba(8,10,22,0.35), transparent)',
          }}
        >
          <span className="text-white/35 text-[10px] shrink-0" title="拖动此栏移动窗口">
            ⠿
          </span>
          <div className="min-w-0 flex-1">
            {title && (
              <p className="text-white/90 text-xs font-medium truncate leading-tight">{title}</p>
            )}
            {subtitle && (
              <p className="text-white/45 text-[10px] truncate leading-tight">{subtitle}</p>
            )}
          </div>

          {actions && (
            <div
              className="flex items-center gap-1 shrink-0"
              style={{ WebkitAppRegion: 'no-drag' }}
            >
              {actions}
            </div>
          )}

          <button
            type="button"
            onClick={handleClose}
            className="w-7 h-7 rounded-full bg-black/40 hover:bg-red-500/80 text-white/80 hover:text-white text-sm flex items-center justify-center shrink-0 transition-colors"
            style={{ WebkitAppRegion: 'no-drag' }}
            title="关闭树屋"
          >
            ✕
          </button>
        </div>
      )}

      {/* Interactive overlays */}
      <div className="absolute inset-0 z-[20] pointer-events-none">
        {children}
      </div>

      {!pureImage && footer && (
        <div
          className="absolute inset-x-0 bottom-0 z-50 px-3 py-2 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, rgba(8,10,22,0.88), transparent)',
          }}
        >
          {footer}
        </div>
      )}
    </motion.div>
  )
}

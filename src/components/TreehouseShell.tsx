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

// ── Floating bubble — transparent glass style ────────────────────────────────
// Gentle bob animation: each bubble floats at different phase so they feel alive

const float = (delay: number) => ({
  animate: { y: [0, -6, 0] },
  transition: {
    duration: 2.8,
    repeat: Infinity,
    ease: 'easeInOut' as const,
    delay,
  },
})

// ── Main component ───────────────────────────────────────────────────────────

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
      style={{
        background: 'transparent',
        WebkitAppRegion: pureImage ? 'no-drag' : 'drag',
      }}
      initial={{ opacity: fadePhase === 'in' ? 0 : 1 }}
      animate={{ opacity: targetOpacity }}
      transition={{ duration, ease }}
      onAnimationComplete={() => {
        if (fadePhase === 'in')  onFadeInComplete?.()
        if (fadePhase === 'out') onFadeOutComplete?.()
      }}
    >
      {/* Treehouse image */}
      <img
        src="materials/treehouse/treehouse.png"
        alt="树屋"
        draggable={false}
        className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
        style={{ opacity: imageOpacity }}
      />

      {/* ── Floating bubble controls ── */}
      {!pureImage && (
        <div
          className="absolute inset-0 z-50"
          style={{ WebkitAppRegion: 'no-drag', pointerEvents: 'none' }}
        >
          {/* ── Left bubble: action slot (更换宠物) ──────────────────────
              Position: ~43% from left, ~22% from top — left canopy bright spot */}
          {actions && (
            <motion.div
              {...float(0)}
              className="absolute"
              style={{
                left: '38%',
                top:  '18%',
                pointerEvents: 'auto',
              }}
            >
              <div className="relative flex flex-col items-center">
                {/* Bubble body */}
                <div
                  className="flex items-center justify-center px-3 h-8 rounded-full"
                  style={{
                    background:    'rgba(255,255,255,0.12)',
                    border:        '1.5px solid rgba(255,255,255,0.35)',
                    backdropFilter:'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    boxShadow:     '0 2px 12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.25)',
                  }}
                >
                  {actions}
                </div>
                {/* Tail */}
                <svg width={10} height={7} viewBox="0 0 10 7" style={{ display: 'block', marginTop: -1 }}>
                  <path d="M5 7 L0 0 L10 0 Z"
                    fill="rgba(255,255,255,0.12)"
                    stroke="rgba(255,255,255,0.30)"
                    strokeWidth="1"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </motion.div>
          )}

          {/* ── Right bubble: close × ────────────────────────────────────
              Position: ~75% from left, ~14% from top — right canopy branch */}
          <motion.div
            {...float(0.9)}
            className="absolute"
            style={{
              left: '72%',
              top:  '12%',
              pointerEvents: 'auto',
            }}
          >
            <div className="relative flex flex-col items-center">
              {/* Bubble body */}
              <button
                type="button"
                onClick={handleClose}
                className="flex items-center justify-center w-8 h-8 rounded-full transition-all"
                style={{
                  background:    'rgba(255,255,255,0.12)',
                  border:        '1.5px solid rgba(255,255,255,0.35)',
                  backdropFilter:'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  boxShadow:     '0 2px 12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.25)',
                  WebkitAppRegion: 'no-drag',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,80,80,0.35)'
                  ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,120,120,0.6)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)'
                  ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.35)'
                }}
                title="关闭树屋"
              >
                <svg width={12} height={12} viewBox="0 0 12 12">
                  <line x1="2" y1="2" x2="10" y2="10" stroke="rgba(255,255,255,0.85)" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="10" y1="2" x2="2" y2="10" stroke="rgba(255,255,255,0.85)" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
              {/* Tail */}
              <svg width={10} height={7} viewBox="0 0 10 7" style={{ display: 'block', marginTop: -1 }}>
                <path d="M5 7 L0 0 L10 0 Z"
                  fill="rgba(255,255,255,0.12)"
                  stroke="rgba(255,255,255,0.30)"
                  strokeWidth="1"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </motion.div>
        </div>
      )}

      {/* Title / subtitle — pixel label, faint, bottom-left of canopy */}
      {!pureImage && (title || subtitle) && (
        <div
          className="absolute z-40 pointer-events-none select-none"
          style={{
            top:   '28%',
            right: '5%',
            WebkitAppRegion: 'no-drag',
          }}
        >
          {title && (
            <p className="text-right text-white/70 text-[11px] font-semibold leading-tight"
              style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
              {title}
            </p>
          )}
          {subtitle && (
            <p className="text-right text-white/35 text-[9px] mt-0.5"
              style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Interactive overlays */}
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

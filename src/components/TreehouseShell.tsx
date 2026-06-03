import React, { useEffect, useRef } from 'react'
import { motion, useMotionValue, useSpring, type MotionValue } from 'framer-motion'
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

// Background parallax layers — ordered back to front.
// depth: how much this layer moves relative to mouse (higher = more movement = closer to viewer)
const BG_LAYERS = [
  { src: 'materials/background/01-sky.png',       depth: 0.4 },
  { src: 'materials/background/02-mountain.png',  depth: 0.7 },
  { src: 'materials/background/03-forest.png',    depth: 1.0 },
  { src: 'materials/background/04-littletree.png',depth: 1.3 },
  { src: 'materials/background/05-bottom.png',    depth: 1.5 },
  { src: 'materials/background/06-grass.png',     depth: 1.7 },
  { src: 'materials/background/07-foretree.png',  depth: 2.0 },
]

// Max pixel shift at deepest layer when mouse is at window edge
const MAX_SHIFT_PX = 18

// Floating bob for buttons
const floatVariants = (delay: number) => ({
  animate: {
    y: [0, -6, 0],
    transition: { duration: 2.8, repeat: Infinity, ease: 'easeInOut' as const, delay },
  },
})

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

  // Mouse position normalised to –1…+1 relative to window center
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const springX = useSpring(rawX, { stiffness: 60, damping: 18 })
  const springY = useSpring(rawY, { stiffness: 60, damping: 18 })

  const containerRef = useRef<HTMLDivElement>(null)

  // Listen on window so parallax keeps working even when mouse is outside the Electron window.
  // We normalise against the treehouse window's own size so depth feels consistent.
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const el = containerRef.current
      if (!el) return
      const { left, top, width, height } = el.getBoundingClientRect()
      // Use screen coordinates relative to window center; clamp to ±1.5 so
      // moving far away from the window still produces a meaningful parallax.
      const nx = Math.max(-1.5, Math.min(1.5, ((e.clientX - left) / width  - 0.5) * 2))
      const ny = Math.max(-1.5, Math.min(1.5, ((e.clientY - top)  / height - 0.5) * 2))
      rawX.set(nx)
      rawY.set(ny)
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [rawX, rawY])


  return (
    <motion.div
      ref={containerRef}
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
      {/* ── Background parallax layers ───────────────────────────────── */}
      {BG_LAYERS.map((layer) => (
        <ParallaxLayer
          key={layer.src}
          springX={springX}
          springY={springY}
          depth={layer.depth}
          bleed={MAX_SHIFT_PX * layer.depth * 1.5}
        >
          <img
            src={layer.src}
            alt=""
            draggable={false}
            className="w-full h-full object-cover"
            style={{ opacity: imageOpacity }}
          />
        </ParallaxLayer>
      ))}

      {/* ── Treehouse image — sits on top of bg, same depth as front layer ── */}
      <ParallaxLayer springX={springX} springY={springY} depth={2.0} bleed={MAX_SHIFT_PX * 2.0 * 1.5}>
        <img
          src="materials/treehouse/treehouse.png"
          alt="树屋"
          draggable={false}
          className="w-full h-full object-contain pointer-events-none select-none"
          style={{ opacity: imageOpacity }}
        />
      </ParallaxLayer>

      {/* ── Floating bubble controls ────────────────────────────────── */}
      {!pureImage && (
        <div
          className="absolute inset-0 z-50"
          style={{ WebkitAppRegion: 'no-drag', pointerEvents: 'none' }}
        >
          {/* Left bubble: actions slot */}
          {actions && (
            <motion.div
              variants={floatVariants(0)}
              animate="animate"
              className="absolute"
              style={{ left: '38%', top: '18%', pointerEvents: 'auto' }}
            >
              <div className="relative flex flex-col items-center">
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
                <BubbleTail />
              </div>
            </motion.div>
          )}

          {/* Right bubble: close × */}
          <motion.div
            variants={floatVariants(0.9)}
            animate="animate"
            className="absolute"
            style={{ left: '72%', top: '12%', pointerEvents: 'auto' }}
          >
            <div className="relative flex flex-col items-center">
              <button
                type="button"
                onClick={handleClose}
                className="flex items-center justify-center w-8 h-8 rounded-full transition-all group"
                style={{
                  background:    'rgba(255,255,255,0.12)',
                  border:        '1.5px solid rgba(255,255,255,0.35)',
                  backdropFilter:'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  boxShadow:     '0 2px 12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.25)',
                  WebkitAppRegion: 'no-drag',
                }}
                onMouseEnter={e => {
                  const b = e.currentTarget as HTMLButtonElement
                  b.style.background  = 'rgba(255,80,80,0.35)'
                  b.style.borderColor = 'rgba(255,120,120,0.6)'
                }}
                onMouseLeave={e => {
                  const b = e.currentTarget as HTMLButtonElement
                  b.style.background  = 'rgba(255,255,255,0.12)'
                  b.style.borderColor = 'rgba(255,255,255,0.35)'
                }}
                title="关闭树屋"
              >
                <svg width={12} height={12} viewBox="0 0 12 12">
                  <line x1="2" y1="2" x2="10" y2="10" stroke="rgba(255,255,255,0.85)" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="10" y1="2" x2="2" y2="10" stroke="rgba(255,255,255,0.85)" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
              <BubbleTail />
            </div>
          </motion.div>
        </div>
      )}

      {/* Title / subtitle */}
      {!pureImage && (title || subtitle) && (
        <div
          className="absolute z-40 pointer-events-none select-none"
          style={{ top: '28%', right: '5%', WebkitAppRegion: 'no-drag' }}
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

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Bubble tail SVG */
const BubbleTail: React.FC = () => (
  <svg width={10} height={7} viewBox="0 0 10 7" style={{ display: 'block', marginTop: -1 }}>
    <path d="M5 7 L0 0 L10 0 Z"
      fill="rgba(255,255,255,0.12)"
      stroke="rgba(255,255,255,0.30)"
      strokeWidth="1"
      strokeLinejoin="round"
    />
  </svg>
)

/** Wraps a child in a parallax-shifted absolute layer */
const ParallaxLayer: React.FC<{
  children: React.ReactNode
  springX:  ReturnType<typeof useSpring>
  springY:  ReturnType<typeof useSpring>
  depth:    number
  bleed:    number
}> = ({ children, springX, springY, depth, bleed }) => {
  const tx = useSpringLayerX(springX, depth)
  const ty = useSpringLayerY(springY, depth)
  return (
    <motion.div
      className="absolute pointer-events-none select-none"
      style={{ inset: `-${bleed}px`, x: tx, y: ty }}
    >
      {children}
    </motion.div>
  )
}

/** Compute per-layer translated x from spring mouse value */
function useSpringLayerX(
  springX: MotionValue<number>,
  depth: number,
): MotionValue<number> {
  const derived = useMotionValue(0)
  springX.on('change', (v) => derived.set(-v * depth * MAX_SHIFT_PX))
  return derived
}

function useSpringLayerY(
  springY: MotionValue<number>,
  depth: number,
): MotionValue<number> {
  const derived = useMotionValue(0)
  springY.on('change', (v) => derived.set(-v * depth * MAX_SHIFT_PX * 0.6))
  return derived
}

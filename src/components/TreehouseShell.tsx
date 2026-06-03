import React, { useEffect, useRef } from 'react'
import { motion, useMotionValue, useSpring, type MotionValue } from 'framer-motion'
import { getElectronAPI } from '../store/petStore'

// Global mouse position in screen coordinates, updated via IPC from main process.
// Shared across all TreehouseShell instances so the poller fires only once.
let _screenX = -9999
let _screenY = -9999
let _globalMouseBound = false

function bindGlobalMouse() {
  if (_globalMouseBound) return
  _globalMouseBound = true
  const api = getElectronAPI()
  if (!api) return
  api.onGlobalMouseMove((pos) => {
    _screenX = pos.x
    _screenY = pos.y
  })
}

export type FadePhase = 'in' | 'visible' | 'out'

interface Props {
  children?:          React.ReactNode
  /** Content placed inside the same ParallaxLayer as the treehouse image (depth 2.0).
   *  Use for furniture overlays that must track the same parallax as the treehouse. */
  sceneLayer?:        React.ReactNode
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
    y: [0, -5, 0],
    transition: { duration: 2.8, repeat: Infinity, ease: 'easeInOut' as const, delay },
  },
})

// ── Pixel speech bubble — semi-transparent white fill, pixel border, highlight ──
// Sharp corners, double-line pixel border, bottom-center pixel tail.
const OvalBubble: React.FC<{
  children:   React.ReactNode
  style?:     React.CSSProperties
  className?: string
}> = ({ children, style, className }) => (
  <div
    className={className}
    style={{
      display:        'inline-flex',
      alignItems:     'center',
      justifyContent: 'center',
      position:       'relative',
      padding:        '7px 14px',
      background:     'rgba(255,255,255,0.22)',
      /* pixel double border: white outer, black mid, white inner */
      outline:        '2px solid rgba(255,255,255,0.85)',
      outlineOffset:  '2px',
      border:         '2px solid rgba(0,0,0,0.80)',
      boxShadow:      [
        '0 3px 10px rgba(0,0,0,0.45)',
        /* bottom-right inner highlight */
        'inset -4px -4px 0px rgba(255,255,255,0.30)',
      ].join(', '),
      imageRendering: 'pixelated',
      backdropFilter:       'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
      ...style,
    }}
  >
    {children}
    {/* Pixel tail — 5 px wide stepped downward */}
    <svg
      width={12} height={8}
      viewBox="0 0 12 8"
      style={{
        position: 'absolute', bottom: -10, left: '50%',
        transform: 'translateX(-50%)', display: 'block',
        imageRendering: 'pixelated', overflow: 'visible',
      }}
    >
      {/* black border pixels */}
      <rect x={0}  y={0} width={4} height={2} fill="rgba(0,0,0,0.80)" />
      <rect x={4}  y={2} width={4} height={2} fill="rgba(0,0,0,0.80)" />
      <rect x={8}  y={0} width={4} height={2} fill="rgba(0,0,0,0.80)" />
      {/* white fill pixels */}
      <rect x={1}  y={0} width={3} height={2} fill="rgba(255,255,255,0.22)" />
      <rect x={4}  y={2} width={4} height={1} fill="rgba(255,255,255,0.22)" />
      <rect x={8}  y={0} width={3} height={2} fill="rgba(255,255,255,0.22)" />
    </svg>
  </div>
)

// ── Pixel close button — same bubble style with pixel × ────────────────────
const OvalCloseButton: React.FC<{
  onClick: () => void
  title?:  string
}> = ({ onClick, title }) => {
  const [hov, setHov] = React.useState(false)
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        width:          30,
        height:         30,
        background:     hov ? 'rgba(220,60,60,0.55)' : 'rgba(255,255,255,0.22)',
        outline:        '2px solid rgba(255,255,255,0.85)',
        outlineOffset:  '2px',
        border:         `2px solid ${hov ? 'rgba(180,30,30,0.90)' : 'rgba(0,0,0,0.80)'}`,
        boxShadow:      [
          '0 3px 10px rgba(0,0,0,0.45)',
          'inset -3px -3px 0px rgba(255,255,255,0.30)',
        ].join(', '),
        imageRendering: 'pixelated',
        backdropFilter:       'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        cursor:         'pointer',
        transition:     'background 0.1s, border-color 0.1s',
        WebkitAppRegion:'no-drag' as React.CSSProperties['WebkitAppRegion'],
      }}
    >
      {/* Pixel × — 2px square dots */}
      <svg width={12} height={12} viewBox="0 0 12 12" style={{ imageRendering:'pixelated', display:'block' }}>
        <rect x={1}  y={1}  width={2} height={2} fill="white" />
        <rect x={3}  y={3}  width={2} height={2} fill="white" />
        <rect x={5}  y={5}  width={2} height={2} fill="white" />
        <rect x={7}  y={3}  width={2} height={2} fill="white" />
        <rect x={9}  y={1}  width={2} height={2} fill="white" />
        <rect x={7}  y={7}  width={2} height={2} fill="white" />
        <rect x={3}  y={7}  width={2} height={2} fill="white" />
        <rect x={1}  y={9}  width={2} height={2} fill="white" />
        <rect x={9}  y={9}  width={2} height={2} fill="white" />
      </svg>
    </button>
  )
}

export const TreehouseShell: React.FC<Props> = ({
  children,
  sceneLayer,
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

  // Bind the IPC global mouse listener once (works outside window bounds).
  // Falls back to DOM mousemove when running outside Electron (e.g. browser dev).
  useEffect(() => {
    const api = getElectronAPI()
    if (api) {
      // Electron path: receive screen-space coords pushed by main at ~30 fps
      bindGlobalMouse()
      const raf = { id: 0 }
      const tick = () => {
        const el = containerRef.current
        if (el && _screenX !== -9999) {
          const rect = el.getBoundingClientRect()
          // Convert screen → client: on Windows clientRect is already in screen px
          // when window has no scaling. getBoundingClientRect gives us page coords;
          // we need screen coords for _screenX/_screenY.
          // Approximate: screen origin of window = screenLeft/screenTop
          const winLeft = window.screenLeft ?? window.screenX ?? 0
          const winTop  = window.screenTop  ?? window.screenY ?? 0
          const clientX = _screenX - winLeft
          const clientY = _screenY - winTop
          const nx = Math.max(-2, Math.min(2, ((clientX - rect.left) / rect.width  - 0.5) * 2))
          const ny = Math.max(-2, Math.min(2, ((clientY - rect.top)  / rect.height - 0.5) * 2))
          rawX.set(nx)
          rawY.set(ny)
        }
        raf.id = requestAnimationFrame(tick)
      }
      raf.id = requestAnimationFrame(tick)
      return () => cancelAnimationFrame(raf.id)
    } else {
      // Browser fallback
      const onMove = (e: MouseEvent) => {
        const el = containerRef.current
        if (!el) return
        const { left, top, width, height } = el.getBoundingClientRect()
        rawX.set(Math.max(-2, Math.min(2, ((e.clientX - left) / width  - 0.5) * 2)))
        rawY.set(Math.max(-2, Math.min(2, ((e.clientY - top)  / height - 0.5) * 2)))
      }
      window.addEventListener('mousemove', onMove)
      return () => window.removeEventListener('mousemove', onMove)
    }
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
        if (fadePhase === 'out') {
          // Immediately hide to prevent any flash on re-render after fade completes
          if (containerRef.current) containerRef.current.style.visibility = 'hidden'
          onFadeOutComplete?.()
        }
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

      {/* ── Treehouse image + furniture scene layer + parallax-tracked UI buttons ── */}
      <ParallaxLayer springX={springX} springY={springY} depth={2.0} bleed={MAX_SHIFT_PX * 2.0 * 1.5}>
        <img
          src="materials/treehouse/treehouse.png"
          alt="树屋"
          draggable={false}
          className="w-full h-full object-contain pointer-events-none select-none"
          style={{ opacity: imageOpacity }}
        />
        {sceneLayer}

        {/* Buttons live inside the depth-2.0 layer so they track with the treehouse */}
        {!pureImage && (
          <div
            className="absolute inset-0"
            style={{ pointerEvents: 'none', WebkitAppRegion: 'no-drag' }}
          >
            {/* Actions bubble — left side of canopy, ~20% from left, ~12% from top */}
            {actions && (
              <motion.div
                variants={floatVariants(0)}
                animate="animate"
                style={{ position: 'absolute', left: '20%', top: '12%', pointerEvents: 'auto', zIndex: 10 }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <OvalBubble>
                    {actions}
                  </OvalBubble>
                </div>
              </motion.div>
            )}

            {/* Close button — right side of canopy, ~65% from left, ~7% from top */}
            <motion.div
              variants={floatVariants(0.9)}
              animate="animate"
              style={{ position: 'absolute', left: '65%', top: '7%', pointerEvents: 'auto', zIndex: 10 }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <OvalCloseButton onClick={handleClose} title="关闭树屋" />
              </div>
            </motion.div>
          </div>
        )}
      </ParallaxLayer>

      {/* Title / subtitle — centred at bottom */}
      {!pureImage && (title || subtitle) && (
        <div
          className="absolute z-40 pointer-events-none select-none"
          style={{
            bottom: '6%',
            left: 0,
            right: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            WebkitAppRegion: 'no-drag',
          }}
        >
          {title && (
            <p
              className="text-center text-white/80 text-[11px] font-semibold leading-tight"
              style={{
                fontFamily: '"Press Start 2P", monospace',
                fontSize: 9,
                textShadow: '0 1px 6px rgba(0,0,0,0.95), 0 0 12px rgba(0,0,0,0.7)',
                letterSpacing: '0.05em',
              }}
            >
              {title}
            </p>
          )}
          {subtitle && (
            <p
              className="text-center text-white/40 mt-1"
              style={{
                fontFamily: '"Press Start 2P", monospace',
                fontSize: 9,
                textShadow: '0 1px 4px rgba(0,0,0,0.9)',
                letterSpacing: '0.03em',
              }}
            >
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

/** Wraps a child in a parallax-shifted absolute layer */
const ParallaxLayer: React.FC<{
  children:      React.ReactNode
  springX:       ReturnType<typeof useSpring>
  springY:       ReturnType<typeof useSpring>
  depth:         number
  bleed:         number
  allowPointer?: boolean
}> = ({ children, springX, springY, depth, bleed, allowPointer = false }) => {
  const tx = useSpringLayerX(springX, depth)
  const ty = useSpringLayerY(springY, depth)
  return (
    <motion.div
      className={`absolute select-none ${allowPointer ? '' : 'pointer-events-none'}`}
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

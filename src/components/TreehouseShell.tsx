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

// ── Pixel-art speech bubble SVG backgrounds ─────────────────────────────────
// Each bubble is drawn with a crisp 1-px pixel grid + a small bottom-left tail.
// The outer border is dark (like a pixel game UI frame), inner fill is earthy wood tone.

/** Wide bubble — used for action labels like "更换宠物" */
const PixelBubbleWide: React.FC<{ width: number; height: number }> = ({ width, height }) => {
  const s = 4           // pixel size
  const r = s * 2       // corner radius in pixels (2 px units)
  const tailW = s * 3
  const tailH = s * 2

  // Outer rect
  const x0 = 0, y0 = 0
  const x1 = width, y1 = height - tailH

  return (
    <svg
      width={width}
      height={height}
      style={{ imageRendering: 'pixelated', display: 'block', overflow: 'visible' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="px-shadow-w" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="2" dy="3" stdDeviation="0" floodColor="#1a1205" floodOpacity="0.55" />
        </filter>
      </defs>
      {/* Main body — pixel-rounded rect */}
      <rect x={x0} y={y0} width={x1} height={y1} rx={r} ry={r}
        fill="#3b2a14" filter="url(#px-shadow-w)" />
      <rect x={x0} y={y0} width={x1} height={y1} rx={r} ry={r}
        fill="none" stroke="#1a1205" strokeWidth={s / 2} />
      {/* Inner lighter fill for pixel-art depth */}
      <rect x={x0 + s} y={y0 + s} width={x1 - s * 2} height={y1 - s * 2} rx={r - s / 2} ry={r - s / 2}
        fill="#5c3f1e" />
      {/* Top highlight strip */}
      <rect x={x0 + r} y={y0 + s} width={x1 - r * 2} height={s}
        fill="#7a5530" />
      {/* Tail — bottom-left pixel steps */}
      <polygon
        points={`${s * 2},${y1} ${s * 2 + tailW},${y1} ${s * 2},${y1 + tailH}`}
        fill="#3b2a14" />
      <polygon
        points={`${s * 2},${y1} ${s * 2 + tailW},${y1} ${s * 2},${y1 + tailH}`}
        fill="none" stroke="#1a1205" strokeWidth={s / 2} strokeLinejoin="round" />
    </svg>
  )
}

/** Square bubble — used for the × close button */
const PixelBubbleSquare: React.FC<{ size: number }> = ({ size }) => {
  const s = 4
  const r = s * 2
  const tailW = s * 2
  const tailH = s * 2
  const bodyH = size - tailH

  return (
    <svg
      width={size}
      height={size}
      style={{ imageRendering: 'pixelated', display: 'block', overflow: 'visible' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="px-shadow-s" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="2" dy="3" stdDeviation="0" floodColor="#1a1205" floodOpacity="0.55" />
        </filter>
      </defs>
      <rect x={0} y={0} width={size} height={bodyH} rx={r} ry={r}
        fill="#3b2a14" filter="url(#px-shadow-s)" />
      <rect x={0} y={0} width={size} height={bodyH} rx={r} ry={r}
        fill="none" stroke="#1a1205" strokeWidth={s / 2} />
      <rect x={s} y={s} width={size - s * 2} height={bodyH - s * 2} rx={r - s / 2} ry={r - s / 2}
        fill="#5c3f1e" />
      <rect x={r} y={s} width={size - r * 2} height={s}
        fill="#7a5530" />
      {/* Tail — bottom-right */}
      <polygon
        points={`${size - s * 2 - tailW},${bodyH} ${size - s * 2},${bodyH} ${size - s * 2},${bodyH + tailH}`}
        fill="#3b2a14" />
      <polygon
        points={`${size - s * 2 - tailW},${bodyH} ${size - s * 2},${bodyH} ${size - s * 2},${bodyH + tailH}`}
        fill="none" stroke="#1a1205" strokeWidth={s / 2} strokeLinejoin="round" />
    </svg>
  )
}

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

      {/* ── Pixel-art bubble controls — always visible, sit in the canopy ── */}
      {!pureImage && (
        <div
          className="absolute z-50 flex items-end gap-2"
          style={{
            // Anchor to top-right, inside the leafy canopy area
            top:   '6%',
            right: '4%',
            WebkitAppRegion: 'no-drag',
          }}
        >
          {/* Action bubble (e.g. "更换宠物") — only rendered if actions prop provided */}
          {actions && (
            <div className="relative flex items-center justify-center" style={{ marginBottom: 8 }}>
              {/* Pixel SVG bubble background */}
              <div className="absolute inset-0 pointer-events-none" style={{ bottom: -8 }}>
                <PixelBubbleWide width={96} height={44} />
              </div>
              {/* Label */}
              <div
                className="relative flex items-center gap-1"
                style={{ width: 96, height: 36, paddingBottom: 0 }}
              >
                {actions}
              </div>
            </div>
          )}

          {/* × close bubble */}
          <div className="relative flex items-center justify-center" style={{ marginBottom: 8 }}>
            <div className="absolute inset-0 pointer-events-none" style={{ bottom: -8 }}>
              <PixelBubbleSquare size={40} />
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="relative flex items-center justify-center transition-opacity hover:opacity-75"
              style={{
                width: 40, height: 32,
                WebkitAppRegion: 'no-drag',
              }}
              title="关闭树屋"
            >
              {/* Pixel × drawn in SVG for crispness */}
              <svg width={14} height={14} viewBox="0 0 14 14" style={{ imageRendering: 'pixelated' }}>
                <line x1="2" y1="2" x2="12" y2="12" stroke="#e8c97a" strokeWidth="2.5" strokeLinecap="square" />
                <line x1="12" y1="2" x2="2" y2="12" stroke="#e8c97a" strokeWidth="2.5" strokeLinecap="square" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Title / subtitle — small pixel label below the canopy (only in non-report views) */}
      {!pureImage && (title || subtitle) && (
        <div
          className="absolute z-40 pointer-events-none select-none"
          style={{
            top: 'calc(6% + 52px)',
            right: '4%',
            WebkitAppRegion: 'no-drag',
          }}
        >
          {title && (
            <p
              className="text-right leading-tight"
              style={{
                fontFamily:  "'Courier New', monospace",
                fontSize:    11,
                fontWeight:  700,
                color:       '#e8c97a',
                textShadow:  '1px 1px 0 #1a1205, -1px -1px 0 #1a1205',
                letterSpacing: '0.03em',
              }}
            >
              {title}
            </p>
          )}
          {subtitle && (
            <p
              className="text-right"
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize:   9,
                color:      '#a07840',
                textShadow: '1px 1px 0 #1a1205',
                marginTop:  2,
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

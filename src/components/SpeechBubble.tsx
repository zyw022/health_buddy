import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface Props {
  text:      string | null
  duration?: number
  onDismiss?: () => void
}

/**
 * Pixel-art speech bubble shown above the pet.
 * The tail always points straight down toward the pet.
 * Scale origin is bottom-centre so the pop animation grows from the tail.
 */
export const SpeechBubble: React.FC<Props> = ({
  text,
  duration = 4000,
  onDismiss,
}) => {
  // Delay visibility by two rAF frames so framer-motion has a stable layout
  // before the entrance animation begins — prevents the 1-frame jump.
  // Two-phase render: first frame invisible (layout stabilises), second frame visible.
  // This prevents the "jump from wrong position" that happens when transform:translateX(-50%)
  // is calculated before the parent has its final width.
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (!text) { setVisible(false); return }
    setVisible(false)
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [text])

  useEffect(() => {
    if (!text) return
    const timer = setTimeout(() => onDismiss?.(), duration)
    return () => clearTimeout(timer)
  }, [text, duration, onDismiss])

  const PXF = '"Press Start 2P", monospace'
  // Tail height
  const TAIL_H = 10

  return (
    <AnimatePresence>
      {text && (
        <motion.div
          key={text}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 10 }}
          exit={{    opacity: 0, y: 10 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          style={{ position: 'relative', display: 'inline-block', visibility: visible ? 'visible' : 'hidden' }}
          onClick={onDismiss}
        >
          {/* ── Bubble body — pixel double-border ── */}
          <div style={{
            position:   'relative',
            width:      200,     // fixed width so layout is stable before animation
            padding:    '8px 12px',
            background: '#fffde8',
            // Outer border + inner highlight via box-shadow
            outline:    '2px solid #3d2b00',
            outlineOffset: 0,
            boxShadow:  'inset 0 0 0 2px #f5c842, 2px 2px 0 #3d2b00',
            cursor:     'pointer',
            userSelect: 'none',
          }}>
            {/* Corner pixel accents */}
            {/* TL */}
            <span style={{ position:'absolute', top:0, left:0, width:4, height:4, background:'#3d2b00', display:'block' }}/>
            {/* TR */}
            <span style={{ position:'absolute', top:0, right:0, width:4, height:4, background:'#3d2b00', display:'block' }}/>
            {/* BL */}
            <span style={{ position:'absolute', bottom:0, left:0, width:4, height:4, background:'#3d2b00', display:'block' }}/>
            {/* BR */}
            <span style={{ position:'absolute', bottom:0, right:0, width:4, height:4, background:'#3d2b00', display:'block' }}/>

            <p style={{
              fontFamily:  PXF,
              fontSize:    10,
              lineHeight:  1.7,
              color:       '#2a1800',
              margin:      0,
              textAlign:   'center',
              whiteSpace:  'pre-wrap',
              wordBreak:   'break-word',
            }}>
              {text}
            </p>
          </div>

          {/* ── Tail — pixel stepped triangle pointing DOWN toward the pet ── */}
          {/* Layered 2-px-wide steps: outer (dark), mid (gold), inner (cream) */}
          <div style={{ position:'absolute', left:'50%', top:'100%', transform:'translateX(-50%)', pointerEvents:'none' }}>
            {/* Step 3 — widest, dark outline */}
            <div style={{ width:18, height:2, background:'#3d2b00', margin:'0 auto' }}/>
            {/* Step 2 — mid, gold */}
            <div style={{ width:12, height:2, background:'#f5c842', margin:'0 auto' }}/>
            {/* Step 1 — tip, dark */}
            <div style={{ width:6,  height:2, background:'#3d2b00', margin:'0 auto' }}/>
            <div style={{ width:2,  height:2, background:'#3d2b00', margin:'0 auto' }}/>
          </div>

          {/* Invisible spacer so the parent div's height includes the tail */}
          <div style={{ height: TAIL_H }} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

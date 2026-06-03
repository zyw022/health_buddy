import React, { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface Props {
  text:      string | null
  duration?: number
  onDismiss?: () => void
}

const PXF = '"Press Start 2P", monospace'

/** Typewriter hook — reveals text character by character */
function useTypewriter(text: string | null, speed = 40) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!text) { setDisplayed(''); setDone(false); return }
    setDisplayed('')
    setDone(false)
    let i = 0
    const tick = () => {
      i++
      setDisplayed(text.slice(0, i))
      if (i < text.length) {
        timerRef.current = setTimeout(tick, speed)
      } else {
        setDone(true)
      }
    }
    timerRef.current = setTimeout(tick, speed)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [text, speed])

  return { displayed, done }
}

/**
 * Pixel-art speech bubble shown above the pet.
 * Text is revealed with a typewriter effect.
 * The tail always points straight down toward the pet.
 */
export const SpeechBubble: React.FC<Props> = ({
  text,
  duration = 5000,
  onDismiss,
}) => {
  const [visible, setVisible] = useState(false)
  const { displayed, done } = useTypewriter(text, 38)

  useEffect(() => {
    if (!text) { setVisible(false); return }
    setVisible(false)
    const t = requestAnimationFrame(() => { setVisible(true) })
    return () => cancelAnimationFrame(t)
  }, [text])

  // Auto-dismiss only after typewriter finishes
  useEffect(() => {
    if (!text || !done) return
    const timer = setTimeout(() => onDismiss?.(), duration)
    return () => clearTimeout(timer)
  }, [text, done, duration, onDismiss])

  const TAIL_H = 10

  return (
    <AnimatePresence mode="wait">
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
            width:      200,
            padding:    '8px 12px',
            background: '#fffde8',
            outline:    '2px solid #3d2b00',
            outlineOffset: 0,
            boxShadow:  'inset 0 0 0 2px #f5c842, 2px 2px 0 #3d2b00',
            cursor:     'pointer',
            userSelect: 'none',
          }}>
            {/* Corner pixel accents */}
            <span style={{ position:'absolute', top:0, left:0, width:4, height:4, background:'#3d2b00', display:'block' }}/>
            <span style={{ position:'absolute', top:0, right:0, width:4, height:4, background:'#3d2b00', display:'block' }}/>
            <span style={{ position:'absolute', bottom:0, left:0, width:4, height:4, background:'#3d2b00', display:'block' }}/>
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
              minHeight:   '1.7em',
            }}>
              {displayed}
              {/* Blinking cursor while typing */}
              {!done && (
                <span style={{ display:'inline-block', width:2, height:'0.9em', background:'#2a1800',
                  marginLeft:2, verticalAlign:'middle',
                  animation:'blink-cursor 0.7s step-end infinite' }} />
              )}
            </p>
          </div>

          {/* ── Tail ── */}
          <div style={{ position:'absolute', left:'50%', top:'100%', transform:'translateX(-50%)', pointerEvents:'none' }}>
            <div style={{ width:18, height:2, background:'#3d2b00', margin:'0 auto' }}/>
            <div style={{ width:12, height:2, background:'#f5c842', margin:'0 auto' }}/>
            <div style={{ width:6,  height:2, background:'#3d2b00', margin:'0 auto' }}/>
            <div style={{ width:2,  height:2, background:'#3d2b00', margin:'0 auto' }}/>
          </div>

          <div style={{ height: TAIL_H }} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

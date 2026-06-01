import React, { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface Props {
  text:      string | null
  duration?: number          // ms before auto-dismiss, default 4000
  onDismiss?: () => void
}

// Floating speech bubble shown above the pet.
// Appears with a spring pop, auto-dismisses after `duration` ms.
export const SpeechBubble: React.FC<Props> = ({
  text,
  duration = 4000,
  onDismiss,
}) => {
  useEffect(() => {
    if (!text) return
    const timer = setTimeout(() => {
      onDismiss?.()
    }, duration)
    return () => clearTimeout(timer)
  }, [text, duration, onDismiss])

  return (
    <AnimatePresence>
      {text && (
        <motion.div
          key={text}
          initial={{ scale: 0.4, opacity: 0, y: 10 }}
          animate={{ scale: 1,   opacity: 1, y: 0 }}
          exit={{    scale: 0.4, opacity: 0, y: 10 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          style={{ originX: '50%', originY: '100%' }}
          className="relative max-w-[180px] min-w-[80px]"
          onClick={onDismiss}
        >
          {/* Bubble body */}
          <div className="
            bg-white
            text-gray-800
            text-xs
            leading-relaxed
            px-3 py-2
            rounded-2xl
            shadow-lg
            border border-gray-100
            text-center
            cursor-pointer
            select-none
          ">
            {text}
          </div>

          {/* Tail pointing down toward the pet */}
          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              top: '100%',
              width: 0,
              height: 0,
              borderLeft: '7px solid transparent',
              borderRight: '7px solid transparent',
              borderTop: '8px solid white',
              filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.08))',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

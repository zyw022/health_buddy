// ─────────────────────────────────────────────
// SpeechBubble — 小鸟说话气泡（打字机效果）
// ─────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  text: string;
  visible?: boolean;
  typingSpeed?: number; // ms per character
  onDismiss?: () => void;
  autoDismissMs?: number;
  className?: string;
}

export const SpeechBubble: React.FC<Props> = ({
  text,
  visible = true,
  typingSpeed = 45,
  onDismiss,
  autoDismissMs,
  className = '',
}) => {
  const [displayed, setDisplayed] = useState('');
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    if (!visible) {
      setDisplayed('');
      return;
    }

    setDisplayed('');
    setTyping(true);
    let i = 0;

    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setTyping(false);
      }
    }, typingSpeed);

    return () => clearInterval(interval);
  }, [text, visible, typingSpeed]);

  useEffect(() => {
    if (!autoDismissMs || typing || !visible) return;
    const t = setTimeout(() => onDismiss?.(), autoDismissMs);
    return () => clearTimeout(t);
  }, [autoDismissMs, typing, visible, onDismiss]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={text}
          initial={{ opacity: 0, scale: 0.85, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 8 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className={`relative ${className}`}
        >
          {/* 气泡主体 */}
          <div
            className="
              relative
              bg-white/95
              text-gray-800
              rounded-2xl
              rounded-bl-sm
              px-4 py-3
              text-sm
              leading-relaxed
              max-w-xs
              min-w-[140px]
              border border-white/50
            "
            style={{ backdropFilter: 'blur(8px)' }}
          >
            <span>{displayed}</span>
            {/* 光标 */}
            {typing && (
              <span
                className="inline-block w-0.5 h-4 bg-gray-500 ml-0.5 align-middle"
                style={{ animation: 'blink-caret 0.8s step-end infinite' }}
              />
            )}
          </div>

          {/* 气泡尾巴（左下角方向，指向小鸟） */}
          <div
            className="absolute -bottom-2 left-5 w-0 h-0"
            style={{
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: '10px solid rgba(255,255,255,0.95)',
            }}
          />

          {/* 关闭按钮 */}
          {onDismiss && !typing && (
            <button
              onClick={onDismiss}
              className="
                absolute -top-2 -right-2
                w-5 h-5
                rounded-full
                bg-gray-300/80
                text-gray-600
                text-xs
                flex items-center justify-center
                hover:bg-gray-400/80
                transition-colors
              "
              aria-label="关闭"
            >
              ×
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { TreehouseShell, type FadePhase } from '../../components/TreehouseShell'
import { usePetStore, getElectronAPI } from '../../store/petStore'

/**
 * Entry phase state machine:
 *   fading-in  → treehouse fades in from opacity 0 (1.2 s)
 *   visible    → fully visible; show hint or auto-close for returning users
 *   fading-out → treehouse fades to opacity 0 (0.9 s), then spawn pet window
 *   done       → animation finished, window will be closed by Electron
 */
type EntryPhase = 'fading-in' | 'visible' | 'fading-out' | 'done'

function toFadePhase(p: EntryPhase): FadePhase {
  if (p === 'fading-in')  return 'in'
  if (p === 'fading-out') return 'out'
  return 'visible'
}

const TreehouseEntry: React.FC = () => {
  const navigate     = useNavigate()
  const isOnboarded  = usePetStore((s) => s.isOnboarded)
  const [phase, setPhase] = useState<EntryPhase>('fading-in')

  // Returning user: after fade-in completes, wait for a click to dismiss
  const handleFadeInComplete = useCallback(() => {
    setPhase('visible')
  }, [])

  // Fade-out complete → create pet window and close treehouse
  const handleFadeOutComplete = useCallback(async () => {
    setPhase('done')
    const api = getElectronAPI()
    if (api) {
      await api.createPetWindow()
      setTimeout(() => api.closeTreehouse(), 200)
    }
  }, [])

  // Click handler:
  //   - adopted user  → start fade-out
  //   - new user      → navigate into selection flow (tree stays visible)
  const handleClick = useCallback(() => {
    if (phase !== 'visible') return
    if (isOnboarded) {
      setPhase('fading-out')
    } else {
      navigate('/select-pet')
    }
  }, [phase, isOnboarded, navigate])

  // Allow keyboard dismiss too
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') handleClick()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleClick])

  const hintText = isOnboarded ? '点击任意处进入' : '点击树屋，开始相遇'

  if (phase === 'done') return null

  return (
    <TreehouseShell
      pureImage
      fadePhase={toFadePhase(phase)}
      onFadeInComplete={handleFadeInComplete}
      onFadeOutComplete={() => { void handleFadeOutComplete() }}
    >
      {/* Full-window click target */}
      {phase === 'visible' && (
        <button
          type="button"
          className="absolute inset-0 pointer-events-auto cursor-pointer"
          onClick={handleClick}
          aria-label={hintText}
        />
      )}

      {/* Hint text — appears after fade-in with a slight delay */}
      <AnimatePresence>
        {phase === 'visible' && (
          <motion.div
            key="hint"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-1.5 pointer-events-none"
          >
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              className="text-white/60 text-xs tracking-wider"
            >
              {hintText}
            </motion.div>
            <div className="w-4 h-px bg-white/25 rounded-full" />
          </motion.div>
        )}
      </AnimatePresence>
    </TreehouseShell>
  )
}

export default TreehouseEntry

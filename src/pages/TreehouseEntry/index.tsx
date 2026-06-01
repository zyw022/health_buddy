import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { usePetStore } from '../../store/petStore'
import { getElectronAPI } from '../../store/petStore'

type Phase = 'fading-in' | 'waiting' | 'transitioning'

const TreehouseEntry: React.FC = () => {
  const navigate    = useNavigate()
  const isOnboarded = usePetStore((s) => s.isOnboarded)
  const [phase, setPhase] = useState<Phase>('fading-in')

  // After image fades in, decide what to show
  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase('waiting')

      if (isOnboarded) {
        // Returning user: auto-transition after 2s
        setTimeout(async () => {
          setPhase('transitioning')
          const api = getElectronAPI()
          if (api) {
            await api.createPetWindow()
            // Small delay then close this window
            setTimeout(() => api.closeTreehouse(), 800)
          }
        }, 2000)
      }
    }, 1400)  // wait for fade-in

    return () => clearTimeout(timer)
  }, [isOnboarded])

  const handleClick = async () => {
    if (phase !== 'waiting' || isOnboarded) return
    setPhase('transitioning')
    navigate('/select-pet')
  }

  return (
    <div
      className="w-screen h-screen relative overflow-hidden flex flex-col items-center justify-between"
      style={{ background: '#0d0d1a', cursor: isOnboarded ? 'default' : 'pointer' }}
      onClick={handleClick}
    >
      {/* Treehouse image — fades in from center */}
      <motion.img
        src="treehouse/treehouseorigin.jpg"
        alt="Health Buddy Treehouse"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1,  scale: 1 }}
        transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ imageRendering: 'auto' }}
      />

      {/* Dark overlay gradient at bottom */}
      <div
        className="absolute inset-x-0 bottom-0 h-40 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(13,13,26,0.9), transparent)' }}
      />

      {/* Top title */}
      <motion.div
        className="relative z-10 mt-10 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1,  y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        <h1 className="text-3xl font-light text-white tracking-widest drop-shadow-lg">
          Health Buddy
        </h1>
        <p className="text-white/50 text-sm mt-1 tracking-wider">
          你的健康小伙伴，住在这里
        </p>
      </motion.div>

      {/* Bottom hint */}
      <motion.div
        className="relative z-10 mb-10 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === 'waiting' ? 1 : 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {isOnboarded ? (
          <p className="text-white/50 text-xs animate-pulse">欢迎回来～</p>
        ) : (
          <p className="text-white/40 text-xs">点击任意位置，开始相遇</p>
        )}
      </motion.div>
    </div>
  )
}

export default TreehouseEntry

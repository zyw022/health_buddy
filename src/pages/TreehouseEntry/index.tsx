import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { TreehouseShell } from '../../components/TreehouseShell'
import { usePetStore, getElectronAPI } from '../../store/petStore'

type Phase = 'waiting' | 'transitioning'

const TreehouseEntry: React.FC = () => {
  const navigate = useNavigate()
  const isOnboarded = usePetStore((s) => s.isOnboarded)
  const [phase, setPhase] = useState<Phase>('waiting')

  useEffect(() => {
    if (!isOnboarded) return

    const timer = setTimeout(async () => {
      setPhase('transitioning')
      const api = getElectronAPI()
      if (api) {
        await api.createPetWindow()
        setTimeout(() => api.closeTreehouse(), 800)
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [isOnboarded])

  const handleClick = () => {
    if (phase !== 'waiting' || isOnboarded) return
    setPhase('transitioning')
    navigate('/select-pet')
  }

  return (
    <TreehouseShell
      title="Health Buddy"
      subtitle={isOnboarded ? '欢迎回来' : '点击树屋开始相遇'}
    >
      {!isOnboarded && phase === 'waiting' && (
        <button
          type="button"
          className="absolute inset-0 pointer-events-auto cursor-pointer"
          style={{ top: 36 }}
          onClick={handleClick}
          aria-label="开始选宠"
        />
      )}

      {!isOnboarded && (
        <motion.p
          className="absolute bottom-10 left-0 right-0 text-center text-white/50 text-xs pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          点击树屋，开始相遇
        </motion.p>
      )}
    </TreehouseShell>
  )
}

export default TreehouseEntry

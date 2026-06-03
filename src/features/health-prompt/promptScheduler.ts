import { useEffect, useRef } from 'react'
import { usePetStore } from '../../store/petStore'
import { useHealthStore } from '../../store/healthStore'
import { getPetMessage } from '../../engine/dialogLibrary'
import type { PetAction } from '../../store/types'

// How long each health-triggered action is shown before returning to idle.
const ACTION_DISPLAY_MS = 5000   // 5 seconds

// Cooldowns per reminder type (ms)
const COOLDOWNS = {
  sedentary:  60 * 60 * 1000,   // 1 hour
  hydration:   2 * 60 * 60 * 1000,
  fatigue:    30 * 60 * 1000,
  stress:     45 * 60 * 1000,
}

const lastFired: Record<string, number> = {
  sedentary: 0,
  hydration: 0,
  fatigue:   0,
  stress:    0,
}

function canFire(key: string): boolean {
  return Date.now() - lastFired[key] >= COOLDOWNS[key as keyof typeof COOLDOWNS]
}

function fire(key: string): void {
  lastFired[key] = Date.now()
}

export function usePromptScheduler(): void {
  const config    = usePetStore((s) => s.config)
  const setBubble = usePetStore((s) => s.setBubble)
  const setAction = usePetStore((s) => s.setAction)
  const health    = useHealthStore((s) => s.state)

  // Holds the return-to-idle timer so we can cancel it if a new action fires sooner.
  const returnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const playAction = (action: PetAction, bubble: string) => {
    if (returnTimerRef.current !== null) {
      clearTimeout(returnTimerRef.current)
    }
    setAction(action)
    setBubble(bubble)
    returnTimerRef.current = setTimeout(() => {
      setAction('idle')
      returnTimerRef.current = null
    }, ACTION_DISPLAY_MS)
  }

  useEffect(() => {
    const CHECK_INTERVAL = 60_000   // check every 60s

    const timer = setInterval(() => {
      if (!health || !config) return

      let triggered = false

      if (!triggered && health.sedentary >= 80 && canFire('sedentary')) {
        fire('sedentary')
        const msg =
          config.personality === 'coach'  ? '连续坐超过一小时对脊椎有压力，建议站立活动。' :
          config.personality === 'roast'  ? '哼，久坐对身体不好，这你不懂？赶紧起来！' :
          config.personality === 'healer' ? '站起来！站起来！动一动！🎵' :
          '坐了太久了哦，站起来走几步？'
        playAction('stretch', msg)
        triggered = true
      }

      if (!triggered && health.hydrationDue && canFire('hydration')) {
        fire('hydration')
        const msg =
          config.personality === 'coach'  ? '记得补水，脱水会降低认知能力。' :
          config.personality === 'roast'  ? '哼，又忘了喝水？快去喝！' :
          config.personality === 'healer' ? '喝水喝水喝水！！水是最好的东西！💧' :
          '该喝水了，别忘了哦。'
        playAction('worried', msg)
        triggered = true
      }

      if (!triggered && health.energy < 20 && canFire('fatigue')) {
        fire('fatigue')
        const msg = getPetMessage(config.personality, 'yawn')
        playAction('yawn', msg)
        triggered = true
      }

      if (!triggered && health.stress >= 75 && canFire('stress')) {
        fire('stress')
        const msg = getPetMessage(config.personality, 'worried')
        playAction('worried', msg)
      }
    }, CHECK_INTERVAL)

    return () => {
      clearInterval(timer)
      if (returnTimerRef.current !== null) {
        clearTimeout(returnTimerRef.current)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [health, config])
}

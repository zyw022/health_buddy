import { useEffect } from 'react'
import { usePetStore } from '../../store/petStore'
import { useHealthStore } from '../../store/healthStore'
import { forceMessage } from '../../engine/petBrain'

// Dedicated health intervention scheduler.
// Runs independent of petBrain's normal cycle to ensure critical reminders fire.

// Cooldowns per reminder type (ms)
const COOLDOWNS = {
  sedentary:   60 * 60 * 1000,   // 1 hour between stretch reminders
  hydration:   2  * 60 * 60 * 1000,   // 2 hours between water reminders
  fatigue:     30 * 60 * 1000,   // 30 min between fatigue reminders
  stress:      45 * 60 * 1000,   // 45 min between stress reminders
}

const lastFired: Record<string, number> = {
  sedentary:  0,
  hydration:  0,
  fatigue:    0,
  stress:     0,
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
  const rawData   = useHealthStore((s) => s.raw)
  const health    = useHealthStore((s) => s.state)

  useEffect(() => {
    const CHECK_INTERVAL = 60_000  // check every 60s

    const timer = setInterval(() => {
      if (!health || !config || !rawData) return

      // Priority order: sedentary > hydration > fatigue > stress
      let triggered = false

      if (!triggered && health.sedentary >= 65 && canFire('sedentary')) {
        fire('sedentary')
        const out = forceMessage(rawData, config)
        setAction('stretch')
        setBubble(out.message ?? '坐了太久啦，站起来走走吧！')
        triggered = true
      }

      if (!triggered && health.hydrationDue && canFire('hydration')) {
        fire('hydration')
        setAction('worried')
        setBubble(
          config.personality === 'coach'  ? '记得补水，脱水影响专注力。' :
          config.personality === 'roast'  ? '哼，又忘了喝水？快去喝！' :
          config.personality === 'healer' ? '喝水喝水！！💧 水是最好的东西！' :
          '该喝水了，别忘了哦。',
        )
        triggered = true
      }

      if (!triggered && health.energy < 25 && canFire('fatigue')) {
        fire('fatigue')
        const out = forceMessage(rawData, config)
        setAction('yawn')
        setBubble(out.message ?? '你看起来很累了，要不要小憩一会儿？')
        triggered = true
      }

      if (!triggered && health.stress >= 65 && canFire('stress')) {
        fire('stress')
        const out = forceMessage(rawData, config)
        setAction('worried')
        setBubble(out.message ?? '有点压力大呢，先做个深呼吸？')
      }
    }, CHECK_INTERVAL)

    return () => clearInterval(timer)
  }, [health, config, rawData, setAction, setBubble])
}

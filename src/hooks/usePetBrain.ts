import { useEffect, useRef } from 'react'
import { usePetStore } from '../store/petStore'
import { useHealthStore } from '../store/healthStore'
import { decide } from '../engine/petBrain'

// Subscribes to healthStore changes and runs petBrain.decide() whenever
// new health data arrives. Updates petStore.action and triggers a speech bubble
// if the brain emits a message.
export function usePetBrain(): void {
  const setAction  = usePetStore((s) => s.setAction)
  const setBubble  = usePetStore((s) => s.setBubble)
  const config     = usePetStore((s) => s.config)
  const healthRaw  = useHealthStore((s) => s.raw)

  // Track previous raw reference to detect changes
  const prevRawRef = useRef(healthRaw)

  useEffect(() => {
    if (!healthRaw || !config) return
    if (prevRawRef.current === healthRaw) return
    prevRawRef.current = healthRaw

    const output = decide(healthRaw, config)
    setAction(output.action)

    if (output.message) {
      setBubble(output.message)
    }
  }, [healthRaw, config, setAction, setBubble])
}

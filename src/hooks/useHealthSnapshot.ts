import { useEffect } from 'react'
import { getMockHealthData } from '../mock/mockHealthData'
import { useHealthStore } from '../store/healthStore'
import { analyzeHealth } from '../engine/healthAnalyzer'

const POLL_INTERVAL_MS = 60_000  // refresh every 60 seconds

// Starts a polling loop that feeds mock health data into healthStore.
// Phase 2: replace getMockHealthData() with IPC call to get-health-data.
export function useHealthSnapshot(): void {
  const { setRaw, setState, persistToday } = useHealthStore()

  useEffect(() => {
    function update() {
      const raw   = getMockHealthData()
      const state = analyzeHealth(raw)
      setRaw(raw)
      setState(state)
      void persistToday(raw, state)
    }

    // Immediate first snapshot
    update()

    const timer = setInterval(update, POLL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [setRaw, setState, persistToday])
}

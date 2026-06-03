import type { RawHealthData } from '../store/types'

// Simulates a user who:
//   - Has been sitting for 97 min (triggers stretch)
//   - Moderate sleep (7h30m, quality 4)
//   - High screen time (4h23m)
//   - Hasn't drunk enough water
export const MOCK_HEALTH: RawHealthData = {
  steps:             8432,
  sleepMinutes:      450,  // 7h30m
  sleepQuality:      4,
  heartRate:         72,
  waterCups:         2,    // below expected → hydrationDue
  mood:              null,
  sedentaryMinutes:  97,   // over 90 → stretch trigger
  keystrokesPerMin:  28,
  screenTimeMinutes: 263,  // 4h23m
  activeMinutes:     263,
}

// Returns slightly varied mock data each call to simulate live changes.
// Steps accumulate gradually during the day (base + elapsed-minutes-based drift).
export function getMockHealthData(): RawHealthData {
  const minuteOfDay = new Date().getHours() * 60 + new Date().getMinutes()
  // Simulate ~8000 steps by end of day; add small random noise per poll
  const stepsAccum = Math.round((minuteOfDay / 1440) * 8000 + (Math.random() - 0.5) * 200)
  return {
    ...MOCK_HEALTH,
    steps:            Math.max(0, stepsAccum),
    sedentaryMinutes: MOCK_HEALTH.sedentaryMinutes + Math.floor(Math.random() * 10),
    keystrokesPerMin: Math.max(5, MOCK_HEALTH.keystrokesPerMin + Math.round((Math.random() - 0.5) * 10)),
  }
}

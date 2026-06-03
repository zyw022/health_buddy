import type { HealthState, PetAction } from '../store/types'

// Maps the current HealthState to a PetAction.
// Priority (highest → lowest):
//   sleep > drowsy > yawn > stretch > worried > talk > flyhappy > takeoff > happy > idle
// Thresholds are intentionally conservative so the pet stays in idle/happy most of the time.

export function mapHealthToAction(state: HealthState): PetAction {
  if (state.sleepDue)                                                          return 'sleep'
  if (state.energy < 10)                                                       return 'drowsy'   // only when critically exhausted
  if (state.energy < 20)                                                       return 'yawn'     // very fatigued
  if (state.sedentary >= 80)                                                   return 'stretch'  // ~72+ min sedentary
  if (state.stress >= 75 || state.hydrationDue)                                return 'worried'
  if (state.burnout <= 5 && state.energy >= 90 && state.stress < 15)          return 'flyhappy' // peak condition — rare celebration
  if (state.energy >= 70 && state.stress < 30)                                return 'happy'
  if (state.energy >= 60 && state.stress < 40 && Math.random() < 0.06)        return 'takeoff'  // 6% chance occasional greet
  return 'idle'
}

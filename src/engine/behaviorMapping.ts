import type { HealthState, PetAction } from '../store/types'

// Maps the current HealthState to a PetAction.
// Priority (highest → lowest):
//   sleep > drowsy > yawn > stretch > worried > talk > flyhappy > takeoff > happy > idle

export function mapHealthToAction(state: HealthState): PetAction {
  if (state.sleepDue)                                      return 'sleep'
  if (state.energy < 15)                                   return 'drowsy'    // extremely fatigued — use new sprite
  if (state.energy < 25)                                   return 'yawn'      // very fatigued
  if (state.sedentary >= 65)                               return 'stretch'   // sitting too long
  if (state.stress >= 65 || state.hydrationDue)            return 'worried'
  if (state.burnout <= 5 && state.energy >= 85 && state.stress < 20) return 'flyhappy'  // peak condition — celebrate
  if (state.energy >= 70 && state.stress < 30)             return 'happy'
  if (state.energy >= 60 && state.stress < 40 && Math.random() < 0.15) return 'takeoff' // occasional greet
  return 'idle'
}

import type { HealthState, PetAction } from '../store/types'

// Maps the current HealthState to a PetAction.
// Priority (highest → lowest):
//   sleep > yawn > stretch > worried > talk > happy > idle

export function mapHealthToAction(state: HealthState): PetAction {
  if (state.sleepDue)          return 'sleep'
  if (state.energy < 25)       return 'yawn'       // very fatigued
  if (state.sedentary >= 65)   return 'stretch'    // sitting too long
  if (state.stress >= 65 || state.hydrationDue) return 'worried'
  if (state.energy >= 70 && state.stress < 30)  return 'happy'
  return 'idle'
}

import type { PetAction } from '../store/types'

// Prevents rapid state thrashing: a state must hold for at least MIN_HOLD_MS
// before it can be superseded by a different state.
const MIN_HOLD_MS = 30_000  // 30 seconds

interface StateMachineState {
  current:   PetAction
  changedAt: number
}

let sm: StateMachineState = {
  current:   'idle',
  changedAt: 0,
}

export function transition(next: PetAction): PetAction {
  const now = Date.now()
  if (sm.current === next) return sm.current

  // Allow immediate transition to higher-priority states
  const priority: PetAction[] = ['sleep', 'yawn', 'stretch', 'worried', 'talk', 'happy', 'idle']
  const currentPriority = priority.indexOf(sm.current)
  const nextPriority    = priority.indexOf(next)

  const heldLongEnough = now - sm.changedAt >= MIN_HOLD_MS
  const isHigherPriority = nextPriority < currentPriority  // lower index = higher priority

  if (isHigherPriority || heldLongEnough) {
    sm = { current: next, changedAt: now }
  }

  return sm.current
}

export function resetStateMachine(): void {
  sm = { current: 'idle', changedAt: 0 }
}

export function getCurrentState(): PetAction {
  return sm.current
}

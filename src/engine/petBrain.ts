import type { HealthState, PetConfig, BrainOutput } from '../store/types'
import { analyzeHealth } from './healthAnalyzer'
import type { RawHealthData } from '../store/types'
import { mapHealthToAction } from './behaviorMapping'
import { getPetMessage } from './dialogLibrary'
import { transition } from './stateMachine'

// Determines whether the brain should emit a speech bubble message.
// Messages are throttled: emit at most once every MESSAGE_COOLDOWN_MS.
const MESSAGE_COOLDOWN_MS = 120_000  // 2 minutes
let lastMessageAt = 0

export function decide(raw: RawHealthData, config: PetConfig): BrainOutput {
  const state    = analyzeHealth(raw)
  const intended = mapHealthToAction(state)
  const action   = transition(intended)

  const now = Date.now()
  let message: string | null = null

  if (now - lastMessageAt >= MESSAGE_COOLDOWN_MS) {
    const silentActions = new Set(['idle'])
    const rareActions   = new Set(['happy', 'takeoff'])   // emit with probability
    if (!silentActions.has(action)) {
      if (rareActions.has(action)) {
        if (Math.random() < 0.3) {
          message = getPetMessage(config.personality, action)
          lastMessageAt = now
        }
      } else {
        message = getPetMessage(config.personality, action)
        lastMessageAt = now
      }
    }
  }

  return { action, message, systemCmd: null }
}

// Full analysis pipeline (used by hooks to also update healthStore)
export function analyzeAndDecide(
  raw: RawHealthData,
  config: PetConfig,
): { output: BrainOutput; state: HealthState } {
  const state  = analyzeHealth(raw)
  const output = decide(raw, config)
  return { output, state }
}

// Force a bubble message (e.g. from promptScheduler)
export function forceMessage(raw: RawHealthData, config: PetConfig): BrainOutput {
  const state   = analyzeHealth(raw)
  const intended = mapHealthToAction(state)
  const action   = transition(intended)
  const message  = getPetMessage(config.personality, action)
  lastMessageAt  = Date.now()
  return { action, message, systemCmd: null }
}

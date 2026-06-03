// ── Shared type definitions ───────────────────────────────────────────────

export type PetSpecies   = 'sparrow' | 'cockatiel' | 'shrike' | 'swift' | 'cat' | 'fox' | 'bear'
export type PetGender    = 'male' | 'female'
export type Personality  = 'coach' | 'friend' | 'roast' | 'healer'
export type FeatherColor = 'yellow' | 'blue' | 'green' | 'white' | 'brown' | 'orange'

export interface PetConfig {
  userId:       string
  name:         string
  species:      PetSpecies
  gender:       PetGender
  personality:  Personality
  featherColor: FeatherColor
  /** true = skip adoption flow on next launch; false/undefined = show adoption flow */
  adopted?:     boolean
}

// Seven animation states driven by Pet Brain
export type PetAction = 'idle' | 'happy' | 'yawn' | 'sleep' | 'stretch' | 'worried' | 'talk'

export interface RawHealthData {
  steps:             number
  sleepMinutes:      number
  sleepQuality:      1 | 2 | 3 | 4 | 5
  heartRate:         number | null
  waterCups:         number
  mood:              number | null
  sedentaryMinutes:  number
  keystrokesPerMin:  number
  screenTimeMinutes: number
  activeMinutes:     number
}

export interface HealthState {
  energy:        number   // 0-100, low = needs rest
  stress:        number   // 0-100, high = needs relief
  burnout:       number   // 0-100, high = overwork risk
  sedentary:     number   // 0-100, high = needs to move
  hydrationDue:  boolean
  sleepDue:      boolean
  timestamp:     number
}

export interface SpriteSheetDef {
  file: string    // path relative to assetstore (served at /)
  cols: number
  fps:  number
}

export type SystemCmdType =
  | { type: 'open-file';  path: string }
  | { type: 'open-url';   url: string }
  | { type: 'notify';     title: string; body: string }
  | { type: 'play-music'; query: string }

export interface BrainOutput {
  action:    PetAction
  message:   string | null
  systemCmd: SystemCmdType | null
}

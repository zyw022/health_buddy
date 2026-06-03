import type { PetAction, PetSpecies, SpriteSheetDef } from '../store/types'

// Bird sprite sheets: 6 cols × 2 rows = 12 frames per action
const BIRD_COLS = 6
const BIRD_ROWS = 2

/** English filename (within the species folder) for each action */
const BIRD_ACTION_FILES: Record<PetAction, string> = {
  // Core 7
  idle:     'idle.png',
  happy:    'happy.png',
  talk:     'talk.png',
  yawn:     'yawn.png',
  sleep:    'sleep.png',
  worried:  'worried.png',
  stretch:  'stretch.png',
  // Newly activated — were unused before rename
  takeoff:  'takeoff.png',   // 小起飞 — greet / wake-up
  flyhappy: 'flyhappy.png',  // 快乐起飞 — celebration / milestone
  drowsy:   'drowsy.png',    // 犯困 — low-energy / bedtime
}

const BIRD_FPS: Record<PetAction, number> = {
  idle:     8,
  happy:    10,
  talk:     10,
  yawn:     6,
  sleep:    5,
  worried:  8,
  stretch:  8,
  takeoff:  12,
  flyhappy: 12,
  drowsy:   6,
}

/** Sprite folder per species (relative to assetstore public dir) */
const SPECIES_FOLDER: Record<PetSpecies, string> = {
  sparrow:   'pets/birds/gentle',
  cockatiel: 'pets/birds/gentle',
  shrike:    'pets/birds/gentle',
  swift:     'pets/birds/gentle',
  // New species: own folders (English-named placeholder sprites)
  cat:       'pets/cat',
  fox:       'pets/fox',
  bear:      'pets/bear',
}

/** For cat/fox/bear, map the full 10 actions to the 4 placeholder sheets */
const NON_BIRD_ACTION_FILES: Record<PetAction, string> = {
  idle:     'usual.png',
  happy:    'usual.png',
  talk:     'chat.png',
  yawn:     'tired.png',
  sleep:    'tired.png',
  worried:  'prompt.png',
  stretch:  'prompt.png',
  takeoff:  'usual.png',
  flyhappy: 'usual.png',
  drowsy:   'tired.png',
}

const BIRD_SPECIES = new Set<PetSpecies>(['sparrow', 'cockatiel', 'shrike', 'swift'])

export function getSpriteConfig(species: PetSpecies, action: PetAction): SpriteSheetDef {
  const folder = SPECIES_FOLDER[species] ?? 'pets/birds/gentle'
  const file   = BIRD_SPECIES.has(species)
    ? BIRD_ACTION_FILES[action]
    : NON_BIRD_ACTION_FILES[action]
  if (BIRD_SPECIES.has(species)) {
    return { file: `${folder}/${file}`, cols: BIRD_COLS, rows: BIRD_ROWS, fps: BIRD_FPS[action] }
  }
  return { file: `${folder}/${file}`, cols: BIRD_COLS, rows: BIRD_ROWS, fps: BIRD_FPS[action] }
}

// Backward-compatible static export — bird sprites
export const SPRITE_CONFIG: Record<PetAction, SpriteSheetDef> = {
  idle:     getSpriteConfig('sparrow', 'idle'),
  happy:    getSpriteConfig('sparrow', 'happy'),
  talk:     getSpriteConfig('sparrow', 'talk'),
  yawn:     getSpriteConfig('sparrow', 'yawn'),
  sleep:    getSpriteConfig('sparrow', 'sleep'),
  worried:  getSpriteConfig('sparrow', 'worried'),
  stretch:  getSpriteConfig('sparrow', 'stretch'),
  takeoff:  getSpriteConfig('sparrow', 'takeoff'),
  flyhappy: getSpriteConfig('sparrow', 'flyhappy'),
  drowsy:   getSpriteConfig('sparrow', 'drowsy'),
}

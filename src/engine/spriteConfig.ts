import type { PetAction, PetSpecies, SpriteSheetDef } from '../store/types'

// All bird sprite sheets: 6590×2209 px, 3 horizontal frames (2197×2209 each)

/** File name within the species folder for each action group */
const BIRD_ACTION_FILES: Record<PetAction, string> = {
  idle:    '眨眼.png',
  happy:   '散发爱心.png',
  talk:    '提示.png',
  yawn:    '打哈欠.png',
  sleep:   '趴下.png',
  worried: '轻微摇头.png',
  stretch: '抬脚.png',
}

const BIRD_FPS: Record<PetAction, number> = {
  idle:    8,
  happy:   10,
  talk:    10,
  yawn:    6,
  sleep:   5,
  worried: 8,
  stretch: 8,
}

/** Sprite folder per species (relative to assetstore public dir) */
const SPECIES_FOLDER: Record<PetSpecies, string> = {
  sparrow:   'pets/birds/gentle',
  cockatiel: 'pets/birds/gentle',
  shrike:    'pets/birds/gentle',
  swift:     'pets/birds/gentle',
  // New species: own folders, fall back to bird sprites until real assets are added
  cat:       'pets/cat',
  fox:       'pets/fox',
  bear:      'pets/bear',
}

/** Action→file for non-bird species (English-named placeholders in their folders) */
const NEW_SPECIES_ACTION_FILES: Record<PetAction, string> = {
  idle:    'usual.png',
  happy:   'usual.png',
  talk:    'chat.png',
  yawn:    'tired.png',
  sleep:   'tired.png',
  worried: 'prompt.png',
  stretch: 'prompt.png',
}

const BIRD_SPECIES = new Set<PetSpecies>(['sparrow', 'cockatiel', 'shrike', 'swift'])

export function getSpriteConfig(species: PetSpecies, action: PetAction): SpriteSheetDef {
  const folder = SPECIES_FOLDER[species] ?? 'pets/birds/gentle'
  const file   = BIRD_SPECIES.has(species)
    ? BIRD_ACTION_FILES[action]
    : NEW_SPECIES_ACTION_FILES[action]
  return { file: `${folder}/${file}`, cols: 3, fps: BIRD_FPS[action] }
}

// Backward-compatible static export — still points at bird sprites for existing callers
export const SPRITE_CONFIG: Record<PetAction, SpriteSheetDef> = {
  idle:    getSpriteConfig('sparrow', 'idle'),
  happy:   getSpriteConfig('sparrow', 'happy'),
  talk:    getSpriteConfig('sparrow', 'talk'),
  yawn:    getSpriteConfig('sparrow', 'yawn'),
  sleep:   getSpriteConfig('sparrow', 'sleep'),
  worried: getSpriteConfig('sparrow', 'worried'),
  stretch: getSpriteConfig('sparrow', 'stretch'),
}

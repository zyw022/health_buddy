import type { PetSpecies, PetGender, Personality, FeatherColor } from '../../store/types'

export type SelectionPhase = 'explore' | 'appearance' | 'personality' | 'naming'

export interface SpeciesSpot {
  id:    PetSpecies
  label: string
  emoji: string
  /** Anchor point on treehouse image (percent) */
  x:     number
  y:     number
}

export const SPECIES_SPOTS: SpeciesSpot[] = [
  { id: 'sparrow',   label: '麻雀',     emoji: '🐦', x: 16, y: 58 },
  { id: 'cockatiel', label: '玄凤鹦鹉', emoji: '🦜', x: 40, y: 50 },
  { id: 'shrike',    label: '伯劳',     emoji: '🐤', x: 62, y: 42 },
  { id: 'swift',     label: '雨燕',     emoji: '🦅', x: 84, y: 55 },
]

export const COLOR_OPTIONS: { id: FeatherColor; label: string; hex: string }[] = [
  { id: 'yellow', label: '金黄', hex: '#FFD54F' },
  { id: 'blue',   label: '海蓝', hex: '#42A5F5' },
  { id: 'green',  label: '草绿', hex: '#66BB6A' },
  { id: 'white',  label: '雪白', hex: '#ECEFF1' },
  { id: 'brown',  label: '棕褐', hex: '#8D6E63' },
  { id: 'orange', label: '橘橙', hex: '#FFA726' },
]

export const GENDER_OPTIONS: { id: PetGender; symbol: string; label: string }[] = [
  { id: 'female', symbol: '♀', label: '女生' },
  { id: 'male',   symbol: '♂', label: '男生' },
]

export const PERSONALITY_OPTIONS: { id: Personality; label: string; desc: string; color: string }[] = [
  { id: 'coach',  label: '教练型', desc: '严格督促', color: '#ef4444' },
  { id: 'friend', label: '朋友型', desc: '温柔陪伴', color: '#60a5fa' },
  { id: 'roast',  label: '吐槽型', desc: '嘴硬心软', color: '#f97316' },
  { id: 'healer', label: '治愈型', desc: '情绪支持', color: '#a78bfa' },
]

/** Floating bubble positions (percent) for personality phase */
export const PERSONALITY_BUBBLE_LAYOUT: { x: number; y: number }[] = [
  { x: 22, y: 28 },
  { x: 72, y: 22 },
  { x: 18, y: 62 },
  { x: 78, y: 58 },
]

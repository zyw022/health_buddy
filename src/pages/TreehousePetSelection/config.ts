import type { PetSpecies, PetGender, Personality, FeatherColor } from '../../store/types'

export type SelectionPhase = 'species' | 'appearance' | 'personality' | 'naming'

export interface SpeciesCard {
  id:       PetSpecies
  label:    string
  emoji:    string
  desc:     string
  /** Accent color for the card border / glow */
  accent:   string
}

export const SPECIES_CARDS: SpeciesCard[] = [
  {
    id:     'sparrow',
    label:  '麻雀',
    emoji:  '🐦',
    desc:   '活泼好动，叽叽喳喳',
    accent: '#86efac',
  },
  {
    id:     'cat',
    label:  '猫咪',
    emoji:  '🐱',
    desc:   '慵懒优雅，偶尔撒娇',
    accent: '#fda4af',
  },
  {
    id:     'fox',
    label:  '小狐狸',
    emoji:  '🦊',
    desc:   '机灵调皮，充满好奇',
    accent: '#fdba74',
  },
  {
    id:     'bear',
    label:  '小熊',
    emoji:  '🐻',
    desc:   '憨厚温暖，最爱睡觉',
    accent: '#c4b5fd',
  },
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

export const PHASE_HINTS: Record<SelectionPhase, string> = {
  species:     '选择你的宠物伙伴',
  appearance:  '选择性别与毛色',
  personality: '点击漂浮的性格气泡',
  naming:      '给你的伙伴取个名字',
}

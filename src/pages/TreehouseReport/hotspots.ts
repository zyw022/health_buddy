import type { ChartPoint } from '../../components/HealthChart'
import bboxes from './furniture-bboxes.json'

export type PanelType  = 'chart-line' | 'chart-bar' | 'chart-dimensions' | 'preferences' | 'history'
export type GlowType   = 'normal' | 'gold'
export type HotspotId  =
  | 'clock' | 'note' | 'bowl' | 'sofa' | 'flower' | 'potion' | 'painting' | 'lamp'

/** Hit region on the treehouse canvas (percent, same coords as full-size overlay). */
export interface FurnitureHitbox {
  x: number
  y: number
  w: number
  h: number
}

export interface FurnitureDef {
  id:        HotspotId
  label:     string
  hint:      string
  src:       string
  hitbox:    FurnitureHitbox
  depth:     number
  panelType: PanelType
  glowType:  GlowType
  seriesKey?: keyof Omit<ChartSeriesBundle, 'dimensions'> | 'dimensions'
}

export const FURNITURE: FurnitureDef[] = [
  {
    id: 'clock', label: '挂钟', hint: '今日久坐时间',
    src: 'materials/furniture/clock.png',
    hitbox: bboxes.clock, depth: 0.8,
    panelType: 'chart-line', glowType: 'normal', seriesKey: 'clock',
  },
  {
    id: 'note', label: '便笺', hint: '睡眠时长与质量',
    src: 'materials/furniture/note.png',
    hitbox: bboxes.note, depth: 1.0,
    panelType: 'chart-line', glowType: 'normal', seriesKey: 'note',
  },
  {
    id: 'bowl', label: '水池边的碗', hint: '每日饮水量',
    src: 'materials/furniture/bowl.png',
    hitbox: bboxes.bowl, depth: 0.9,
    panelType: 'chart-bar', glowType: 'normal', seriesKey: 'bowl',
  },
  {
    id: 'sofa', label: '沙发抱枕', hint: '今日四维度健康评分',
    src: 'materials/furniture/pillow.png',
    hitbox: bboxes.sofa, depth: 1.1,
    panelType: 'chart-dimensions', glowType: 'normal', seriesKey: 'dimensions',
  },
  {
    id: 'flower', label: '二楼的花', hint: '今日步数',
    src: 'materials/furniture/flower.png',
    hitbox: bboxes.flower, depth: 0.7,
    panelType: 'chart-bar', glowType: 'normal', seriesKey: 'flower',
  },
  {
    id: 'potion', label: '床边的药水', hint: '心率与压力指数',
    src: 'materials/furniture/potion.png',
    hitbox: bboxes.potion, depth: 1.0,
    panelType: 'chart-bar', glowType: 'normal', seriesKey: 'potion',
  },
  {
    id: 'painting', label: '二楼的挂画', hint: '点击编辑你的偏好存档',
    src: 'materials/furniture/painting.png',
    hitbox: bboxes.painting, depth: 0.5,
    panelType: 'preferences', glowType: 'gold',
  },
  {
    id: 'lamp', label: '二楼的灯', hint: '宠物的所有历史建议',
    src: 'materials/furniture/lamp.png',
    hitbox: bboxes.lamp, depth: 0.6,
    panelType: 'history', glowType: 'gold',
  },
]

export interface ChartSeriesBundle {
  clock:    { title: string; unit: string; points: ChartPoint[] }
  note:     { title: string; unit: string; points: ChartPoint[] }
  bowl:     { title: string; unit: string; points: ChartPoint[] }
  flower:   { title: string; unit: string; points: ChartPoint[] }
  potion:   { title: string; unit: string; points: ChartPoint[] }
  book:     { title: string; unit: string; points: ChartPoint[] }
  cup:      { title: string; unit: string; points: ChartPoint[] }
  shoes:    { title: string; unit: string; points: ChartPoint[] }
  lamp:     { title: string; unit: string; points: ChartPoint[] }
  painting: { title: string; unit: string; points: ChartPoint[] }
  dimensions: {
    title:     string
    energy:    number
    stress:    number
    burnout:   number
    sedentary: number
  }
}

export type HotspotDef = FurnitureDef
export const HOTSPOTS  = FURNITURE

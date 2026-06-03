#!/usr/bin/env node
/**
 * generate-chart-data.mjs
 *
 * Reads health-history/*.json and health-today.json, then writes
 * assetstore/data/chart-series.json for TreehouseReport hover charts.
 *
 * Series produced:
 *   book / note    — sleep hours (same data, two furniture items)
 *   clock          — sedentary minutes
 *   bowl / cup     — water cups (same data)
 *   flower / shoes — steps (same data)
 *   potion         — heart rate
 *   screenTime     — screen time minutes
 *   sleepQuality   — sleep quality score (1-5 → *20 = 0-100)
 *   dimensions     — latest 4-dimension state scores
 *
 * Usage: node scripts/generate-chart-data.mjs
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.resolve(__dirname, '../assetstore/data')
const HISTORY_DIR = path.join(DATA_DIR, 'health-history')

function point(date, value) {
  return { date, label: date, value: value ?? 0 }
}

async function readJson(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}

async function loadHistoryEntries() {
  let files
  try {
    files = (await fs.readdir(HISTORY_DIR)).filter((f) => f.endsWith('.json')).sort()
  } catch {
    files = []
  }

  const entries = []
  for (const file of files) {
    const data = await readJson(path.join(HISTORY_DIR, file))
    if (data?.raw && data?.date) {
      entries.push({ date: data.date, raw: data.raw, state: data.state })
    }
  }

  // Fallback: use today's data if no history with raw fields
  if (entries.length === 0) {
    const today = await readJson(path.join(DATA_DIR, 'health-today.json'))
    if (today?.raw) {
      const date = today.date?.split('T')[0] ?? new Date().toISOString().split('T')[0]
      entries.push({ date, raw: today.raw, state: today.state })
    }
  }

  return entries.sort((a, b) => a.date.localeCompare(b.date))
}

async function main() {
  const entries = await loadHistoryEntries()
  if (entries.length === 0) {
    console.error('No health data found. Run: node scripts/seed-health-data.mjs')
    process.exit(1)
  }

  const latest = entries[entries.length - 1]
  const state = latest.state ?? {}

  // Also append today's data if not already included
  const today = await readJson(path.join(DATA_DIR, 'health-today.json'))
  const todayDate = today?.date?.split('T')[0] ?? new Date().toISOString().split('T')[0]
  const lastDate = entries[entries.length - 1]?.date
  if (today?.raw && todayDate !== lastDate) {
    entries.push({ date: todayDate, raw: today.raw, state: today.state })
  }
  const latestWithToday = entries[entries.length - 1]
  const latestState = latestWithToday.state ?? {}

  const sleepSeries = {
    title: '睡眠时长',
    unit: '小时',
    points: entries.map(({ date, raw }) =>
      point(date, Math.round((raw.sleepMinutes / 60) * 10) / 10),
    ),
  }

  const sedentarySeries = {
    title: '久坐时长',
    unit: '分钟',
    points: entries.map(({ date, raw }) => point(date, raw.sedentaryMinutes ?? 0)),
  }

  const waterSeries = {
    title: '饮水量',
    unit: '杯',
    points: entries.map(({ date, raw }) => point(date, raw.waterCups ?? 0)),
  }

  const stepsSeries = {
    title: '步数',
    unit: '步',
    points: entries.map(({ date, raw }) => point(date, raw.steps ?? 0)),
  }

  const heartRateSeries = {
    title: '心率',
    unit: 'bpm',
    points: entries.map(({ date, raw }) => point(date, raw.heartRate ?? 0)),
  }

  const screenTimeSeries = {
    title: '屏幕时间',
    unit: '分钟',
    points: entries.map(({ date, raw }) => point(date, raw.screenTimeMinutes ?? 0)),
  }

  const sleepQualitySeries = {
    title: '睡眠质量',
    unit: '分',
    points: entries.map(({ date, raw }) =>
      point(date, (raw.sleepQuality ?? 0) * 20),
    ),
  }

  const activeMinutesSeries = {
    title: '活跃时长',
    unit: '分钟',
    points: entries.map(({ date, raw }) => point(date, raw.activeMinutes ?? 0)),
  }

  const chartSeries = {
    // Sleep — note (便笺) & book alias
    note:         sleepSeries,
    book:         sleepSeries,
    // Sedentary — clock (挂钟)
    clock:        sedentarySeries,
    // Water — bowl (饮水碗) & cup alias
    bowl:         waterSeries,
    cup:          waterSeries,
    // Steps — flower (绿植) & shoes alias
    flower:       stepsSeries,
    shoes:        stepsSeries,
    // Heart rate — potion (药水瓶)
    potion:       heartRateSeries,
    // Screen time — painting (挂画 / extra)
    screenTime:   screenTimeSeries,
    // Sleep quality — sofa extra series
    sleepQuality: sleepQualitySeries,
    // Active minutes
    lamp:         activeMinutesSeries,
    painting:     sleepQualitySeries,
    // 4-dimension state (sofa 沙发)
    dimensions: {
      title:     '今日四维度',
      energy:    latestState.energy    ?? 0,
      stress:    latestState.stress    ?? 0,
      burnout:   latestState.burnout   ?? 0,
      sedentary: latestState.sedentary ?? 0,
    },
    generatedAt: new Date().toISOString(),
    sourceDays: entries.length,
  }

  const outPath = path.join(DATA_DIR, 'chart-series.json')
  await fs.writeFile(outPath, JSON.stringify(chartSeries, null, 2), 'utf-8')

  console.log(`✓ chart-series.json (${entries.length} days)`)
  console.log(`  note/book:      sleep hours`)
  console.log(`  clock:          sedentary minutes`)
  console.log(`  bowl/cup:       water cups`)
  console.log(`  flower/shoes:   steps`)
  console.log(`  potion:         heart rate`)
  console.log(`  lamp:           active minutes`)
  console.log(`  painting:       sleep quality`)
  console.log(`  screenTime:     screen time minutes`)
  console.log(`  sleepQuality:   sleep quality (0-100)`)
  console.log(`  dimensions:     4-dimension state scores (latest day)`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

#!/usr/bin/env node
/**
 * seed-health-data.mjs
 *
 * Initializes test health data per ARCHITECTURE.md:
 *   - assetstore/data/health-today.json
 *   - assetstore/data/health-history/YYYY-MM-DD.json (7 days)
 *
 * Usage: node scripts/seed-health-data.mjs
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { analyzeHealth, seededNoise, formatDate, addDays } from './healthUtils.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.resolve(__dirname, '../assetstore/data')
const HISTORY_DIR = path.join(DATA_DIR, 'health-history')

const DAYS = 7
const END_DATE = new Date('2026-06-02T12:00:00')

function buildRawForDay(dayIndex) {
  // dayIndex 0 = oldest, DAYS-1 = today
  const seed = dayIndex + 1

  return {
    steps:             seededNoise(seed * 3, 5200, 11200),
    sleepMinutes:      seededNoise(seed * 5, 360, 510),       // 6h–8.5h
    sleepQuality:      Math.min(5, Math.max(1, seededNoise(seed * 7, 2, 5))),
    heartRate:         seededNoise(seed * 11, 65, 82),
    waterCups:         seededNoise(seed * 13, 3, 9),
    mood:              seededNoise(seed * 17, 2, 5),
    sedentaryMinutes:  seededNoise(seed * 19, 35, 105),
    keystrokesPerMin:  seededNoise(seed * 23, 12, 38),
    screenTimeMinutes: seededNoise(seed * 29, 180, 320),
    activeMinutes:     seededNoise(seed * 31, 200, 380),
  }
}

async function main() {
  await fs.mkdir(HISTORY_DIR, { recursive: true })

  const startDate = addDays(END_DATE, -(DAYS - 1))
  const historyEntries = []

  for (let i = 0; i < DAYS; i++) {
    const date = formatDate(addDays(startDate, i))
    const raw = buildRawForDay(i)
    const state = analyzeHealth(raw, date)

    const isToday = i === DAYS - 1

    if (isToday) {
      await fs.writeFile(
        path.join(DATA_DIR, 'health-today.json'),
        JSON.stringify({ raw, state, date: new Date().toISOString() }, null, 2),
        'utf-8',
      )
      console.log('✓ health-today.json')
    }

    await fs.writeFile(
      path.join(HISTORY_DIR, `${date}.json`),
      JSON.stringify({ raw, state, date }, null, 2),
      'utf-8',
    )
    historyEntries.push({ date, raw, state })
    console.log(`✓ health-history/${date}.json`)
  }

  console.log(`\nSeeded ${DAYS} days of health data ending ${formatDate(END_DATE)}`)
  console.log('Run: node scripts/generate-chart-data.mjs')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

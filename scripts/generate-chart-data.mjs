#!/usr/bin/env node
/**
 * generate-chart-data.mjs
 *
 * Reads health-history/*.json and health-today.json, then writes
 * assetstore/data/chart-series.json for TreehouseReport hover charts.
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
  return { date, label: date, value }
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

  const chartSeries = {
    book: {
      title: '睡眠时长',
      unit: '小时',
      points: entries.map(({ date, raw }) =>
        point(date, Math.round((raw.sleepMinutes / 60) * 10) / 10),
      ),
    },
    clock: {
      title: '久坐分钟',
      unit: '分钟',
      points: entries.map(({ date, raw }) =>
        point(date, raw.sedentaryMinutes),
      ),
    },
    cup: {
      title: '饮水杯数',
      unit: '杯',
      points: entries.map(({ date, raw }) => point(date, raw.waterCups)),
    },
    shoes: {
      title: '步数',
      unit: '步',
      points: entries.map(({ date, raw }) => point(date, raw.steps)),
    },
    dimensions: {
      title: '今日四维度评分',
      energy: state.energy ?? 0,
      stress: state.stress ?? 0,
      burnout: state.burnout ?? 0,
      sedentary: state.sedentary ?? 0,
    },
    generatedAt: new Date().toISOString(),
    sourceDays: entries.length,
  }

  const outPath = path.join(DATA_DIR, 'chart-series.json')
  await fs.writeFile(outPath, JSON.stringify(chartSeries, null, 2), 'utf-8')

  console.log(`✓ chart-series.json (${entries.length} days)`)
  console.log(`  book:  sleep hours trend`)
  console.log(`  clock: sedentary minutes trend`)
  console.log(`  cup:   water cups per day`)
  console.log(`  shoes: steps per day`)
  console.log(`  dimensions: latest 4-dimension scores`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

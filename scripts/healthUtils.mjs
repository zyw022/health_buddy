/**
 * Shared health scoring logic — mirrors src/engine/healthAnalyzer.ts
 * Used by seed-health-data.mjs and generate-chart-data.mjs
 */

export function clamp(v) {
  return Math.round(Math.max(0, Math.min(100, v)))
}

function fatigueScore(raw) {
  const sleepDeficit = Math.max(0, 480 - raw.sleepMinutes) / 480
  const sleepQualityPenalty = (5 - raw.sleepQuality) * 8
  const activityPenalty = raw.keystrokesPerMin < 10 ? 15 : 0
  return clamp(sleepDeficit * 60 + sleepQualityPenalty + activityPenalty)
}

function stressScore(raw) {
  const keystrokeStress = Math.min(50, raw.keystrokesPerMin * 0.5)
  const screenStress = Math.min(30, (raw.screenTimeMinutes - 180) * 0.15)
  const sedentaryStress = Math.min(20, raw.sedentaryMinutes * 0.2)
  return clamp(keystrokeStress + Math.max(0, screenStress) + sedentaryStress)
}

function burnoutScore(raw) {
  const overwork = Math.min(60, Math.max(0, raw.activeMinutes - 360) * 0.3)
  const poorSleep = (5 - raw.sleepQuality) * 8
  return clamp(overwork + poorSleep)
}

export function analyzeHealth(raw, dateStr) {
  const fatigue = fatigueScore(raw)
  const stress = stressScore(raw)
  const burnout = burnoutScore(raw)
  const sedentary = clamp(raw.sedentaryMinutes * 100 / 90)

  const d = dateStr ? new Date(dateStr + 'T12:00:00') : new Date()
  const hour = d.getHours()
  const sleepDue = hour >= 23 || hour < 6
  const wakingHours = Math.max(1, hour - 7)
  const expectedCups = Math.floor(wakingHours / 2)
  const hydrationDue = raw.waterCups < expectedCups

  return {
    energy: clamp(100 - fatigue),
    stress,
    burnout,
    sedentary,
    hydrationDue,
    sleepDue,
    timestamp: d.getTime(),
  }
}

/** Deterministic pseudo-random for reproducible test data */
export function seededNoise(seed, min, max) {
  const x = Math.sin(seed * 9999) * 10000
  const t = x - Math.floor(x)
  return Math.round(min + t * (max - min))
}

export function formatDate(d) {
  return d.toISOString().split('T')[0]
}

export function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

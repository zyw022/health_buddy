import type { RawHealthData, HealthState } from '../store/types'

// Converts raw collected data into 4-dimensional health scores (0–100).
// All scores are clamped and rounded to integers.

function clamp(v: number): number {
  return Math.round(Math.max(0, Math.min(100, v)))
}

function fatigueScore(raw: RawHealthData): number {
  // Higher score = more fatigued
  // Sleep deficit: 8h target, 1h under = +12 pts
  const sleepDeficit = Math.max(0, 480 - raw.sleepMinutes) / 480  // 0–1
  const sleepQualityPenalty = (5 - raw.sleepQuality) * 8          // 0–32

  // Low activity during work hours suggests mental fatigue
  const activityPenalty = raw.keystrokesPerMin < 10 ? 15 : 0

  return clamp(sleepDeficit * 60 + sleepQualityPenalty + activityPenalty)
}

function stressScore(raw: RawHealthData): number {
  // High keystrokes + long screen time = stress signal
  const keystrokeStress = Math.min(50, raw.keystrokesPerMin * 0.5)
  const screenStress    = Math.min(30, (raw.screenTimeMinutes - 180) * 0.15)
  // Sedentary adds stress
  const sedentaryStress = Math.min(20, raw.sedentaryMinutes * 0.2)
  return clamp(keystrokeStress + Math.max(0, screenStress) + sedentaryStress)
}

function burnoutScore(raw: RawHealthData): number {
  // Burnout = long active time with poor sleep quality
  const overwork = Math.min(60, Math.max(0, raw.activeMinutes - 360) * 0.3)
  const poorSleep = (5 - raw.sleepQuality) * 8
  return clamp(overwork + poorSleep)
}

export function analyzeHealth(raw: RawHealthData): HealthState {
  const fatigue   = fatigueScore(raw)
  const stress    = stressScore(raw)
  const burnout   = burnoutScore(raw)
  const sedentary = clamp(raw.sedentaryMinutes * 100 / 90)  // 90 min = max risk

  const hour = new Date().getHours()
  const sleepDue = hour >= 23 || hour < 6

  // Hydration: target 8 cups/day, expect 1 cup every 2h of waking time
  const wakingHours  = Math.max(1, hour - 7)
  const expectedCups = Math.floor(wakingHours / 2)
  const hydrationDue = raw.waterCups < expectedCups

  return {
    energy:       clamp(100 - fatigue),
    stress,
    burnout,
    sedentary,
    hydrationDue,
    sleepDue,
    timestamp:    Date.now(),
  }
}

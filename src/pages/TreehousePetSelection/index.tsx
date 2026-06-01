import React, { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PetSprite } from '../../components/PetSprite'
import { usePetStore, getElectronAPI } from '../../store/petStore'
import type { PetConfig, PetGender, PetSpecies, Personality, FeatherColor } from '../../store/types'
import {
  SPECIES_SPOTS,
  type SelectionPhase,
} from './config'
import { SemicirclePicker } from './SemicirclePicker'
import { PersonalityBubbles } from './PersonalityBubbles'
import { NamingChat } from './NamingChat'

interface Props {
  mode?: 'onboard' | 'change'
}

const PHASE_HINTS: Record<SelectionPhase, string> = {
  explore:     '在树屋中移动鼠标，点击选择你的小鸟',
  appearance:  '选择性别与毛色，半圆环绕在宠物身边',
  personality: '点击漂浮的性格气泡',
  naming:      '给新伙伴取个名字吧',
}

const TreehousePetSelection: React.FC<Props> = ({ mode = 'onboard' }) => {
  const isChangeMode = mode === 'change'
  const { config, setConfig, completeOnboarding, saveToFile } = usePetStore()

  const [phase, setPhase] = useState<SelectionPhase>('explore')
  const [hovered, setHovered] = useState<PetSpecies | null>(null)
  const [species, setSpecies] = useState<PetSpecies | null>(null)
  const [gender, setGender] = useState<PetGender | null>(null)
  const [featherColor, setFeatherColor] = useState<FeatherColor | null>(null)
  const [personality, setPersonality] = useState<Personality | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isChangeMode || !config) return
    setSpecies(config.species)
    setGender(config.gender)
    setFeatherColor(config.featherColor)
    setPersonality(config.personality)
  }, [isChangeMode, config])

  const activeSpot = SPECIES_SPOTS.find((s) => s.id === species) ?? null
  const petLabel = activeSpot?.label ?? '小鸟'

  const selectSpecies = useCallback((id: PetSpecies) => {
    setSpecies(id)
    setGender(null)
    setFeatherColor(null)
    setPhase('appearance')
  }, [])

  const confirmAppearance = useCallback(() => {
    if (gender && featherColor) setPhase('personality')
  }, [gender, featherColor])

  const selectPersonality = useCallback((p: Personality) => {
    setPersonality(p)
    setPhase('naming')
  }, [])

  const handleSave = useCallback(async (name: string) => {
    if (!species || !gender || !featherColor || !personality || saving) return
    setSaving(true)

    const petConfig: PetConfig = {
      userId: 'local',
      name: name.trim(),
      species,
      featherColor,
      gender,
      personality,
    }

    setConfig(petConfig)
    await saveToFile(petConfig)

    const api = getElectronAPI()
    if (isChangeMode) {
      if (api) {
        await api.notifyPetConfigUpdated()
        api.closeTreehouse()
      }
    } else {
      completeOnboarding()
      if (api) {
        await api.createPetWindow()
        setTimeout(() => api.closeTreehouse(), 600)
      }
    }
  }, [species, gender, featherColor, personality, saving, setConfig, saveToFile, isChangeMode, completeOnboarding])

  const goBack = useCallback(() => {
    if (phase === 'naming') {
      setPhase('personality')
      return
    }
    if (phase === 'personality') {
      setPhase('appearance')
      return
    }
    if (phase === 'appearance') {
      setSpecies(null)
      setGender(null)
      setFeatherColor(null)
      setPhase('explore')
    }
  }, [phase])

  const dimOthers = phase !== 'explore' && species !== null

  return (
    <div className="w-screen h-screen relative overflow-hidden select-none" style={{ background: '#0d0d1a' }}>
      <motion.img
        src="treehouse/treehouseorigin.jpg"
        alt="树屋"
        initial={{ opacity: 0 }}
        animate={{ opacity: dimOthers ? 0.55 : 1 }}
        transition={{ duration: 0.5 }}
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {dimOthers && (
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 20%, rgba(8,10,22,0.65) 100%)' }}
        />
      )}

      {/* Header */}
      <div
        className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-6 py-5 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(13,13,26,0.9), transparent)' }}
      >
        <div>
          <h1 className="text-xl font-light text-white tracking-wide">
            {isChangeMode ? '更换宠物' : '选择你的伙伴'}
          </h1>
          <p className="text-white/45 text-xs mt-1">{PHASE_HINTS[phase]}</p>
        </div>
        <div className="flex gap-2 pointer-events-auto">
          {phase !== 'explore' && phase !== 'naming' && (
            <button
              type="button"
              onClick={goBack}
              className="px-3 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white/70 text-xs transition-colors"
            >
              返回
            </button>
          )}
          {isChangeMode && phase === 'explore' && (
            <button
              type="button"
              onClick={() => getElectronAPI()?.closeTreehouse()}
              className="px-3 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white/70 text-xs transition-colors"
            >
              取消
            </button>
          )}
        </div>
      </div>

      {/* Species spots — explore & selected anchor */}
      <div className="absolute inset-0 z-[15]">
        {SPECIES_SPOTS.map((spot) => {
          const isSelected = species === spot.id
          const isHovered = hovered === spot.id
          const hidden = dimOthers && !isSelected
          const interactive = phase === 'explore'

          return (
            <motion.div
              key={spot.id}
              className="absolute flex flex-col items-center"
              style={{
                left: `${spot.x}%`,
                top: `${spot.y}%`,
                transform: 'translate(-50%, -50%)',
                pointerEvents: hidden ? 'none' : 'auto',
              }}
              initial={false}
              animate={{
                opacity: hidden ? 0 : 1,
                scale: isSelected ? 1.15 : isHovered ? 1.08 : 1,
              }}
              transition={{ duration: 0.35 }}
            >
              {interactive && (
                <button
                  type="button"
                  className="absolute inset-0 -m-8 rounded-full z-10"
                  style={{ background: 'transparent' }}
                  onMouseEnter={() => setHovered(spot.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => selectSpecies(spot.id)}
                  aria-label={spot.label}
                />
              )}

              {/* Hover label */}
              <AnimatePresence>
                {(isHovered || isSelected) && phase === 'explore' && (
                  <motion.span
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mb-1 text-white/80 text-xs px-2 py-0.5 rounded-full whitespace-nowrap"
                    style={{ background: 'rgba(15,18,35,0.75)', border: '1px solid rgba(255,255,255,0.15)' }}
                  >
                    {spot.emoji} {spot.label}
                  </motion.span>
                )}
              </AnimatePresence>

              <div
                className="relative rounded-2xl p-1 transition-all duration-300"
                style={{
                  boxShadow: isSelected
                    ? '0 0 32px rgba(125,211,252,0.55)'
                    : isHovered
                      ? '0 0 20px rgba(255,255,255,0.25)'
                      : 'none',
                  border: isSelected
                    ? '2px solid rgba(125,211,252,0.8)'
                    : isHovered
                      ? '2px solid rgba(255,255,255,0.35)'
                      : '2px solid transparent',
                }}
              >
                <PetSprite action={isSelected ? 'happy' : 'idle'} size={isSelected ? 100 : 80} />
              </div>

              {isChangeMode && config?.species === spot.id && phase === 'explore' && (
                <span className="mt-1 text-[10px] text-white/40">当前伙伴</span>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Semicircle gender + color picker */}
      {phase === 'appearance' && activeSpot && (
        <SemicirclePicker
          anchorX={activeSpot.x}
          anchorY={activeSpot.y}
          gender={gender}
          featherColor={featherColor}
          onGender={setGender}
          onColor={setFeatherColor}
          onConfirm={confirmAppearance}
        />
      )}

      {/* Personality bubbles */}
      {phase === 'personality' && (
        <PersonalityBubbles selected={personality} onSelect={selectPersonality} />
      )}

      {/* Naming chat */}
      {phase === 'naming' && (
        <NamingChat
          petLabel={petLabel}
          initialName={isChangeMode ? config?.name ?? '' : ''}
          saving={saving}
          onSubmit={handleSave}
          onCancel={() => setPhase('personality')}
        />
      )}

      {/* Bottom legend in explore phase */}
      {phase === 'explore' && (
        <div
          className="absolute bottom-0 inset-x-0 z-20 px-6 py-4 flex flex-wrap gap-2 justify-center"
          style={{ background: 'linear-gradient(to top, rgba(13,13,26,0.92), transparent)' }}
        >
          {SPECIES_SPOTS.map((s) => (
            <span
              key={s.id}
              className="text-white/35 text-xs px-2.5 py-1 rounded-full border border-white/10"
            >
              {s.emoji} {s.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default TreehousePetSelection

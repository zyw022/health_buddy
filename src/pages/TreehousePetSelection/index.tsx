import React, { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { PetSprite } from '../../components/PetSprite'
import { TreehouseShell } from '../../components/TreehouseShell'
import { usePetStore, getElectronAPI } from '../../store/petStore'
import type { PetConfig, PetGender, PetSpecies, Personality, FeatherColor } from '../../store/types'
import { SPECIES_SPOTS, type SelectionPhase } from './config'
import { SemicirclePicker } from './SemicirclePicker'
import { PersonalityBubbles } from './PersonalityBubbles'
import { NamingChat } from './NamingChat'

interface Props {
  mode?: 'onboard' | 'change'
}

const PHASE_HINTS: Record<SelectionPhase, string> = {
  explore:     '移动鼠标到不同位置，点击选择小鸟',
  appearance:  '选择性别与毛色（半圆环绕）',
  personality: '点击漂浮的性格气泡',
  naming:      '在聊天窗口中取名字',
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

  const dimOthers = phase !== 'explore' && species !== null
  const showBack = phase !== 'explore' && phase !== 'naming'

  return (
    <TreehouseShell
      title={isChangeMode ? '更换宠物' : '选择你的伙伴'}
      subtitle={PHASE_HINTS[phase]}
      imageOpacity={dimOthers ? 0.55 : 1}
      actions={
        showBack ? (
          <button
            type="button"
            onClick={goBack}
            className="px-2.5 h-6 rounded-full bg-white/15 hover:bg-white/25 text-white/75 text-[10px] transition-colors"
          >
            返回
          </button>
        ) : undefined
      }
      footer={
        phase === 'explore' ? (
          <div className="flex flex-wrap gap-1.5 justify-center pointer-events-none">
            {SPECIES_SPOTS.map((s) => (
              <span
                key={s.id}
                className="text-white/40 text-[10px] px-2 py-0.5 rounded-full border border-white/15"
              >
                {s.emoji} {s.label}
              </span>
            ))}
          </div>
        ) : undefined
      }
    >
      {dimOthers && (
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 15%, rgba(8,10,22,0.55) 100%)' }}
        />
      )}

      {SPECIES_SPOTS.map((spot) => {
        const isSelected = species === spot.id
        const isHovered = hovered === spot.id
        const hidden = dimOthers && !isSelected
        const interactive = phase === 'explore'

        return (
          <motion.div
            key={spot.id}
            className="absolute flex flex-col items-center pointer-events-auto"
            style={{
              left: `${spot.x}%`,
              top: `${spot.y}%`,
              transform: 'translate(-50%, -50%)',
              opacity: hidden ? 0 : 1,
              pointerEvents: hidden ? 'none' : 'auto',
            }}
            animate={{
              scale: isSelected ? 1.1 : isHovered ? 1.05 : 1,
            }}
            transition={{ duration: 0.3 }}
          >
            {interactive && (
              <button
                type="button"
                className="absolute inset-0 -m-6 rounded-full z-10"
                style={{ background: 'transparent' }}
                onMouseEnter={() => setHovered(spot.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => selectSpecies(spot.id)}
                aria-label={spot.label}
              />
            )}

            <AnimatePresence>
              {(isHovered || isSelected) && phase === 'explore' && (
                <motion.span
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-1 text-white/85 text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap"
                  style={{ background: 'rgba(0,0,0,0.55)' }}
                >
                  {spot.emoji} {spot.label}
                </motion.span>
              )}
            </AnimatePresence>

            <PetSprite action={isSelected ? 'happy' : 'idle'} size={isSelected ? 72 : 56} />
          </motion.div>
        )
      })}

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

      {phase === 'personality' && (
        <PersonalityBubbles selected={personality} onSelect={selectPersonality} />
      )}

      {phase === 'naming' && (
        <NamingChat
          petLabel={petLabel}
          initialName={isChangeMode ? config?.name ?? '' : ''}
          saving={saving}
          onSubmit={handleSave}
          onCancel={() => setPhase('personality')}
        />
      )}
    </TreehouseShell>
  )
}

export default TreehousePetSelection

import React, { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { PetSprite } from '../../components/PetSprite'
import { TreehouseShell, type FadePhase } from '../../components/TreehouseShell'
import { usePetStore, getElectronAPI } from '../../store/petStore'
import type { PetConfig, PetGender, PetSpecies, Personality, FeatherColor } from '../../store/types'
import {
  SPECIES_CARDS,
  PHASE_HINTS,
  type SelectionPhase,
} from './config'
import { SemicirclePicker } from './SemicirclePicker'
import { PersonalityBubbles } from './PersonalityBubbles'
import { NamingChat } from './NamingChat'

interface Props {
  mode?: 'onboard' | 'change'
}

// Pixel-style section header rendered at the bottom of the shell
const PixelHeader: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <div className="flex flex-col items-center gap-1 pointer-events-none select-none">
    <p
      className="px-label text-white/90 text-center"
      style={{ fontSize: 10 }}
    >
      {title}
    </p>
    {subtitle && (
      <p
        className="px-label text-white/45 text-center"
        style={{ fontSize: 8 }}
      >
        {subtitle}
      </p>
    )}
  </div>
)

const TreehousePetSelection: React.FC<Props> = ({ mode = 'onboard' }) => {
  const isChangeMode = mode === 'change'
  const { config, setConfig, completeOnboarding, saveToFile } = usePetStore()

  const [phase,        setPhase]        = useState<SelectionPhase>('species')
  const [species,      setSpecies]      = useState<PetSpecies | null>(null)
  const [gender,       setGender]       = useState<PetGender | null>(null)
  const [featherColor, setFeatherColor] = useState<FeatherColor | null>(null)
  const [personality,  setPersonality]  = useState<Personality | null>(null)
  const [saving,       setSaving]       = useState(false)
  const [fadePhase,    setFadePhase]    = useState<FadePhase>('visible')

  useEffect(() => {
    if (!isChangeMode || !config) return
    setSpecies(config.species)
    setGender(config.gender)
    setFeatherColor(config.featherColor)
    setPersonality(config.personality)
  }, [isChangeMode, config])

  const activeCard = SPECIES_CARDS.find((c) => c.id === species) ?? null

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
    if (phase === 'naming')      { setPhase('personality'); return }
    if (phase === 'personality') { setPhase('appearance');  return }
    if (phase === 'appearance')  {
      setSpecies(null)
      setGender(null)
      setFeatherColor(null)
      setPhase('species')
    }
  }, [phase])

  const handleSave = useCallback(async (name: string) => {
    if (!species || !gender || !featherColor || !personality || saving) return
    setSaving(true)

    const petConfig: PetConfig = {
      userId:      'local',
      name:        name.trim(),
      species,
      featherColor,
      gender,
      personality,
      adopted:     true,
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
      setFadePhase('out')
    }
  }, [species, gender, featherColor, personality, saving, setConfig, saveToFile, isChangeMode, completeOnboarding])

  const handleFadeOutComplete = useCallback(async () => {
    const api = getElectronAPI()
    if (api) {
      await api.createPetWindow()
      api.closeTreehouse()
    }
  }, [])

  const dimOthers = phase !== 'species' && species !== null
  const showBack  = phase !== 'species' && phase !== 'naming'
  const petLabel  = activeCard?.label ?? '小伙伴'

  const titleNode = (
    <PixelHeader
      title={isChangeMode ? '更换宠物' : PHASE_HINTS[phase]}
      subtitle={phase === 'species' ? '选择一个伙伴开始你们的故事' : undefined}
    />
  )

  return (
    <TreehouseShell
      title={isChangeMode ? '更换宠物' : PHASE_HINTS[phase]}
      subtitle={phase === 'species' ? '选择一个伙伴开始你们的故事' : undefined}
      imageOpacity={dimOthers ? 0.45 : 1}
      fadePhase={fadePhase}
      onFadeOutComplete={() => { void handleFadeOutComplete() }}
      actions={
        showBack ? (
          <button
            type="button"
            onClick={goBack}
            className="px-btn px-label"
            style={{ padding: '4px 10px', fontSize: 9 }}
          >
            ← 返回
          </button>
        ) : undefined
      }
    >
      {/* ── Species selection: 2×2 pixel card grid ──────────────────── */}
      <AnimatePresence>
        {phase === 'species' && (
          <motion.div
            key="species-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-auto z-30"
            style={{ background: 'rgba(6,8,20,0.60)' }}
          >
            <div className="grid grid-cols-2 gap-3 px-5 w-full max-w-[280px]">
              {SPECIES_CARDS.map((card, i) => (
                <motion.button
                  key={card.id}
                  type="button"
                  initial={{ opacity: 0, y: 20, scale: 0.88 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: i * 0.07, type: 'spring', stiffness: 340, damping: 24 }}
                  whileTap={{ scale: 0.95, x: 2, y: 2 }}
                  onClick={() => selectSpecies(card.id)}
                  className="px-card px-card-hover relative flex flex-col items-center gap-1.5 py-4 px-2 outline-none"
                  style={{ border: `3px solid ${card.accent}88` }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = card.accent
                    ;(e.currentTarget as HTMLElement).style.boxShadow = `3px 3px 0 rgba(0,0,0,0.70), 0 0 18px ${card.accent}55`
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = `${card.accent}88`
                    ;(e.currentTarget as HTMLElement).style.boxShadow = '3px 3px 0 rgba(0,0,0,0.70)'
                  }}
                >
                  {/* Pixel emoji badge */}
                  <div
                    className="absolute -top-3 -right-3 w-7 h-7 flex items-center justify-center text-sm"
                    style={{
                      background: `${card.accent}22`,
                      border: `2px solid ${card.accent}`,
                      boxShadow: `2px 2px 0 rgba(0,0,0,0.70)`,
                      imageRendering: 'pixelated',
                    }}
                  >
                    {card.emoji}
                  </div>

                  <PetSprite action="idle" species={card.id} size={60} />

                  <p className="px-label text-white/90 leading-none mt-1" style={{ fontSize: 9 }}>{card.label}</p>
                  <p className="px-label text-white/45 text-center leading-tight" style={{ fontSize: 7 }}>{card.desc}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Dim overlay ─────────────────────────────────────────────── */}
      {dimOthers && (
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 55%, transparent 15%, rgba(6,8,20,0.65) 100%)' }}
        />
      )}

      {/* ── Selected pet at center during appearance/personality ─────── */}
      {species && phase !== 'species' && phase !== 'naming' && (
        <motion.div
          key="selected-pet"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute z-20"
          style={{ left: '50%', top: '54%', transform: 'translate(-50%, -50%)' }}
        >
          <PetSprite
            action={phase === 'appearance' ? 'idle' : 'happy'}
            species={species}
            size={72}
          />
        </motion.div>
      )}

      {/* ── Appearance: gender + color picker ───────────────────────── */}
      {phase === 'appearance' && (
        <SemicirclePicker
          anchorX={50}
          anchorY={54}
          gender={gender}
          featherColor={featherColor}
          onGender={setGender}
          onColor={setFeatherColor}
          onConfirm={confirmAppearance}
        />
      )}

      {/* ── Personality bubbles ──────────────────────────────────────── */}
      {phase === 'personality' && (
        <PersonalityBubbles selected={personality} onSelect={selectPersonality} />
      )}

      {/* ── Naming chat ─────────────────────────────────────────────── */}
      {phase === 'naming' && (
        <NamingChat
          petLabel={petLabel}
          petSpecies={species ?? 'sparrow'}
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

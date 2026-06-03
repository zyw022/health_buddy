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

const TreehousePetSelection: React.FC<Props> = ({ mode = 'onboard' }) => {
  const isChangeMode = mode === 'change'
  const { config, setConfig, completeOnboarding, saveToFile } = usePetStore()

  const [phase,        setPhase]       = useState<SelectionPhase>('species')
  const [species,      setSpecies]     = useState<PetSpecies | null>(null)
  const [gender,       setGender]      = useState<PetGender | null>(null)
  const [featherColor, setFeatherColor] = useState<FeatherColor | null>(null)
  const [personality,  setPersonality] = useState<Personality | null>(null)
  const [saving,       setSaving]      = useState(false)
  const [fadePhase,    setFadePhase]   = useState<FadePhase>('visible')

  // Pre-fill fields when changing pet
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
      // Start fade-out; pet window created after animation completes
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

  const petLabel = activeCard?.label ?? '小伙伴'

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
            className="px-2.5 h-6 rounded-full bg-white/15 hover:bg-white/25 text-white/75 text-[10px] transition-colors"
          >
            返回
          </button>
        ) : undefined
      }
    >
      {/* ── Species selection: 2×2 card grid ───────────────────── */}
      <AnimatePresence>
        {phase === 'species' && (
          <motion.div
            key="species-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-auto z-30"
            style={{ background: 'rgba(8,10,22,0.55)' }}
          >
            <div className="grid grid-cols-2 gap-3 px-6 w-full max-w-xs">
              {SPECIES_CARDS.map((card, i) => (
                <motion.button
                  key={card.id}
                  type="button"
                  initial={{ opacity: 0, y: 16, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: i * 0.07, type: 'spring', stiffness: 380, damping: 26 }}
                  whileHover={{ scale: 1.05, y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => selectSpecies(card.id)}
                  className="relative flex flex-col items-center gap-1.5 rounded-2xl py-4 px-2 transition-all outline-none"
                  style={{
                    background: 'rgba(15,18,35,0.88)',
                    border: `1.5px solid rgba(255,255,255,0.12)`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = card.accent
                    e.currentTarget.style.boxShadow   = `0 0 20px ${card.accent}44`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
                    e.currentTarget.style.boxShadow   = 'none'
                  }}
                >
                  {/* Emoji badge */}
                  <div
                    className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-base"
                    style={{ background: `${card.accent}33`, border: `1.5px solid ${card.accent}88` }}
                  >
                    {card.emoji}
                  </div>

                  {/* Sprite preview */}
                  <PetSprite action="idle" species={card.id} size={64} />

                  <p className="text-white/90 text-xs font-semibold leading-none">{card.label}</p>
                  <p className="text-white/40 text-[10px] leading-tight text-center">{card.desc}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Dim overlay for post-species phases ─────────────────── */}
      {dimOthers && (
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 10%, rgba(8,10,22,0.60) 100%)' }}
        />
      )}

      {/* Anchor the selected pet sprite at center when in appearance/personality */}
      {species && phase !== 'species' && phase !== 'naming' && (
        <motion.div
          key="selected-pet"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute z-20"
          style={{ left: '50%', top: '50%', transform: 'translate(-50%, -60%)' }}
        >
          <PetSprite
            action={phase === 'appearance' ? 'idle' : 'happy'}
            species={species}
            size={80}
          />
        </motion.div>
      )}

      {/* ── Appearance: gender + color semicircle ───────────────── */}
      {phase === 'appearance' && (
        <SemicirclePicker
          anchorX={50}
          anchorY={50}
          gender={gender}
          featherColor={featherColor}
          onGender={setGender}
          onColor={setFeatherColor}
          onConfirm={confirmAppearance}
        />
      )}

      {/* ── Personality bubbles ──────────────────────────────────── */}
      {phase === 'personality' && (
        <PersonalityBubbles selected={personality} onSelect={selectPersonality} />
      )}

      {/* ── Naming chat ─────────────────────────────────────────── */}
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

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PetSprite } from '../../components/PetSprite'
import { usePetStore, getElectronAPI } from '../../store/petStore'
import type { PetSpecies, PetGender, Personality, FeatherColor, PetConfig } from '../../store/types'

// ── Options data ──────────────────────────────────────────────────────────

const SPECIES_OPTIONS: { id: PetSpecies; label: string; emoji: string }[] = [
  { id: 'sparrow',   label: '麻雀',     emoji: '🐦' },
  { id: 'cockatiel', label: '玄凤鹦鹉', emoji: '🦜' },
  { id: 'shrike',    label: '伯劳',     emoji: '🐤' },
  { id: 'swift',     label: '雨燕',     emoji: '🦅' },
]

const COLOR_OPTIONS: { id: FeatherColor; label: string; hex: string }[] = [
  { id: 'yellow', label: '金黄', hex: '#FFD54F' },
  { id: 'blue',   label: '海蓝', hex: '#42A5F5' },
  { id: 'green',  label: '草绿', hex: '#66BB6A' },
  { id: 'white',  label: '雪白', hex: '#ECEFF1' },
  { id: 'brown',  label: '棕褐', hex: '#8D6E63' },
  { id: 'orange', label: '橘橙', hex: '#FFA726' },
]

const PERSONALITY_OPTIONS: { id: Personality; label: string; desc: string }[] = [
  { id: 'coach',  label: '教练型', desc: '严格督促，目标导向，帮你突破自己' },
  { id: 'friend', label: '朋友型', desc: '温柔陪伴，共情理解，暖心鼓励' },
  { id: 'roast',  label: '吐槽型', desc: '嘴硬心软，傲娇风格，幽默激励' },
  { id: 'healer', label: '治愈型', desc: '情绪支持，无条件接纳，治愈系' },
]

const STEPS = ['选种类', '选毛色', '选性格', '取名字'] as const

interface PetSelectionProps {
  mode?: 'onboard' | 'change'
}

const PetSelection: React.FC<PetSelectionProps> = ({ mode = 'onboard' }) => {
  const isChangeMode = mode === 'change'
  const { config, setConfig, completeOnboarding, saveToFile } = usePetStore()

  const [step,         setStep]         = useState(0)
  const [species,      setSpecies]      = useState<PetSpecies>('sparrow')
  const [featherColor, setFeatherColor] = useState<FeatherColor>('yellow')
  const [gender,       setGender]       = useState<PetGender>('female')
  const [personality,  setPersonality]  = useState<Personality>('friend')
  const [name,         setName]         = useState('')
  const [completing,   setCompleting]   = useState(false)

  useEffect(() => {
    if (!isChangeMode || !config) return
    setSpecies(config.species)
    setFeatherColor(config.featherColor)
    setGender(config.gender)
    setPersonality(config.personality)
    setName(config.name)
  }, [isChangeMode, config])

  const canNext = step < 3 || name.trim().length > 0

  const handleNext = async () => {
    if (!canNext) return

    if (step < 3) {
      setStep((s) => s + 1)
      return
    }

    // Final step — save config and launch pet window
    if (completing) return
    setCompleting(true)

    const config: PetConfig = {
      userId:       'local',
      name:         name.trim(),
      species,
      featherColor,
      gender,
      personality,
    }

    setConfig(config)
    await saveToFile(config)

    const api = getElectronAPI()
    if (isChangeMode) {
      if (api) {
        await api.notifyPetConfigUpdated()
        api.closeTreehouse()
      }
      setCompleting(false)
      return
    }

    completeOnboarding()
    if (api) {
      await api.createPetWindow()
      setTimeout(() => api.closeTreehouse(), 600)
    }
  }

  return (
    <div
      className="w-screen h-screen flex overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 30%, #1b2a4a 0%, #0d0d1a 100%)' }}
    >
      {/* Left panel: pet preview */}
      <div className="flex flex-col items-center justify-center w-48 flex-shrink-0 gap-4 px-4">
        <motion.div
          key={featherColor}
          initial={{ scale: 0.85, opacity: 0.6 }}
          animate={{ scale: 1,    opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <PetSprite action="idle" size={140} />
        </motion.div>
        {name && (
          <p className="text-white/60 text-sm text-center">{name}</p>
        )}
      </div>

      {/* Right panel: steps */}
      <div className="flex-1 flex flex-col min-w-0 pr-6 py-8">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white text-lg font-light">
              {isChangeMode ? '更换宠物' : '认识你的小鸟'}
            </h2>
            <span className="text-white/40 text-sm">{step + 1} / {STEPS.length}</span>
          </div>
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="flex-1 h-1 rounded-full transition-all duration-500"
                style={{ background: i <= step ? '#64B5F6' : 'rgba(255,255,255,0.15)' }}
              />
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* Step 0: Species */}
            {step === 0 && (
              <motion.div
                key="species"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-3"
              >
                <p className="text-white/60 text-sm mb-4">选一个你喜欢的小鸟种类</p>
                <div className="grid grid-cols-2 gap-3">
                  {SPECIES_OPTIONS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSpecies(s.id)}
                      className={`
                        flex flex-col items-center justify-center
                        rounded-2xl py-4 gap-2 border-2 transition-all duration-200
                        ${species === s.id
                          ? 'border-blue-400 bg-blue-400/20'
                          : 'border-white/15 bg-white/5 hover:border-white/30'}
                      `}
                    >
                      <span className="text-3xl">{s.emoji}</span>
                      <span className="text-white text-sm">{s.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 1: Color + Gender */}
            {step === 1 && (
              <motion.div
                key="color"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-4"
              >
                <p className="text-white/60 text-sm mb-2">性别</p>
                <div className="flex gap-3">
                  {(['female', 'male'] as PetGender[]).map((g) => (
                    <button
                      key={g}
                      onClick={() => setGender(g)}
                      className={`
                        flex-1 py-2 rounded-xl border-2 text-sm transition-all
                        ${gender === g
                          ? 'border-blue-400 bg-blue-400/20 text-white'
                          : 'border-white/15 bg-white/5 text-white/60 hover:border-white/30'}
                      `}
                    >
                      {g === 'female' ? '♀ 女生' : '♂ 男生'}
                    </button>
                  ))}
                </div>

                <p className="text-white/60 text-sm mt-4">毛色</p>
                <div className="grid grid-cols-3 gap-3">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setFeatherColor(c.id)}
                      className={`
                        flex flex-col items-center gap-2 py-3 rounded-2xl border-2 transition-all
                        ${featherColor === c.id
                          ? 'border-blue-400 bg-blue-400/10'
                          : 'border-white/10 bg-white/5 hover:border-white/25'}
                      `}
                    >
                      <div
                        className="w-8 h-8 rounded-full border-2 border-white/20"
                        style={{ background: c.hex }}
                      />
                      <span className="text-white/70 text-xs">{c.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Personality */}
            {step === 2 && (
              <motion.div
                key="personality"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-3"
              >
                <p className="text-white/60 text-sm mb-4">你希望你的小鸟是什么性格？</p>
                {PERSONALITY_OPTIONS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPersonality(p.id)}
                    className={`
                      w-full flex items-center justify-between
                      rounded-2xl px-4 py-3 border-2 transition-all text-left
                      ${personality === p.id
                        ? 'border-blue-400 bg-blue-400/20'
                        : 'border-white/15 bg-white/5 hover:border-white/30'}
                    `}
                  >
                    <div>
                      <div className="text-white font-medium text-sm">{p.label}</div>
                      <div className="text-white/50 text-xs mt-0.5">{p.desc}</div>
                    </div>
                    {personality === p.id && (
                      <div className="w-5 h-5 rounded-full bg-blue-400 flex items-center justify-center text-white text-xs flex-shrink-0">
                        ✓
                      </div>
                    )}
                  </button>
                ))}
              </motion.div>
            )}

            {/* Step 3: Name */}
            {step === 3 && (
              <motion.div
                key="name"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-4"
              >
                <p className="text-white/60 text-sm mb-4">给你的小鸟取个名字吧！</p>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 12))}
                  placeholder="最多 12 个字"
                  maxLength={12}
                  className="
                    w-full bg-white/10 border-2 border-white/20 rounded-2xl
                    px-4 py-3 text-white placeholder-white/30
                    text-lg text-center outline-none focus:border-blue-400 transition-colors
                  "
                  autoFocus
                />
                <p className="text-white/30 text-xs text-center">{name.length}/12</p>

                {/* Summary */}
                <div className="mt-4 bg-white/5 rounded-2xl px-4 py-3 space-y-2">
                  <p className="text-white/40 text-xs mb-2">你的选择：</p>
                  {[
                    ['种类', SPECIES_OPTIONS.find((s) => s.id === species)?.label],
                    ['毛色', COLOR_OPTIONS.find((c) => c.id === featherColor)?.label],
                    ['性别', gender === 'female' ? '女生' : '男生'],
                    ['性格', PERSONALITY_OPTIONS.find((p) => p.id === personality)?.label],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between text-sm">
                      <span className="text-white/50">{k}</span>
                      <span className="text-white">{v}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-3 pt-6">
          {(step > 0 || isChangeMode) && (
            <button
              onClick={() => {
                if (step > 0) setStep((s) => s - 1)
                else getElectronAPI()?.closeTreehouse()
              }}
              className="
                flex-none px-5 py-3 rounded-2xl
                border border-white/20 text-white/70
                hover:border-white/40 transition-colors text-sm
              "
            >
              {step > 0 ? '上一步' : '取消'}
            </button>
          )}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleNext}
            disabled={!canNext || completing}
            className={`
              flex-1 py-3 rounded-2xl font-medium text-white
              transition-all duration-200 text-sm
              ${canNext && !completing
                ? 'bg-blue-500 hover:bg-blue-400'
                : 'bg-white/10 text-white/30 cursor-not-allowed'}
            `}
          >
            {completing
              ? '正在保存…'
              : step === 3
                ? (isChangeMode ? '确认更换 🐦' : '开始养鸟 🐦')
                : '下一步'}
          </motion.button>
        </div>
      </div>
    </div>
  )
}

export default PetSelection

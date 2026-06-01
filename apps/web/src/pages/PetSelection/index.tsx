// ─────────────────────────────────────────────
// PetSelection — 选宠物页面
//
// 用户选择小鸟种类、毛色、性别、名字、性格。
// 结果存入 Zustand（持久化到 localStorage）。
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { PetConfig } from '@health-buddy/shared-types';
import { PetSprite } from '../../components/PetSprite';
import { usePetStore } from '../../store/petStore';

// ── 选项数据 ──────────────────────────────────

const SPECIES_OPTIONS = [
  { id: 'sparrow', label: '麻雀', emoji: '🐦' },
  { id: 'cockatiel', label: '玄凤鹦鹉', emoji: '🦜' },
  { id: 'shrike', label: '伯劳', emoji: '🐤' },
  { id: 'swift', label: '雨燕', emoji: '🦅' },
] as const;

const COLOR_OPTIONS: { id: string; label: string; hex: string }[] = [
  { id: 'yellow', label: '金黄', hex: '#FFD54F' },
  { id: 'blue', label: '海蓝', hex: '#42A5F5' },
  { id: 'green', label: '草绿', hex: '#66BB6A' },
  { id: 'white', label: '雪白', hex: '#ECEFF1' },
  { id: 'brown', label: '棕褐', hex: '#8D6E63' },
  { id: 'orange', label: '橘橙', hex: '#FFA726' },
];

const PERSONALITY_OPTIONS = [
  { id: 'gentle', label: '温柔', desc: '说话轻声细语，暖心陪伴' },
  { id: 'tsundere', label: '傲娇', desc: '口是心非，嘴硬心软' },
  { id: 'cheerful', label: '开朗', desc: '活泼爱笑，正能量满满' },
  { id: 'calm', label: '沉稳', desc: '话不多，但说的都有道理' },
  { id: 'playful', label: '调皮', desc: '喜欢开玩笑，爱整蛊' },
] as const;

type Personality = (typeof PERSONALITY_OPTIONS)[number]['id'];
type Species = (typeof SPECIES_OPTIONS)[number]['id'];

// ── 步骤配置 ──────────────────────────────────

const STEPS = ['选种类', '选毛色', '选性格', '取名字'] as const;

// ── 主组件 ──────────────────────────────────

const PetSelection: React.FC = () => {
  const navigate = useNavigate();
  const { setConfig, completeOnboarding } = usePetStore();

  const [step, setStep] = useState(0);
  const [species, setSpecies] = useState<Species>('sparrow');
  const [featherColor, setFeatherColor] = useState('yellow');
  const [personality, setPersonality] = useState<Personality>('gentle');
  const [gender, setGender] = useState<'male' | 'female'>('female');
  const [name, setName] = useState('');

  const previewConfig: PetConfig = {
    species,
    featherColor,
    personality,
    gender,
    name: name || '小鸟',
    voiceStyle: 'soft',
    enableCamera: false,
    enableVoice: false,
  };

  const canNext = () => {
    if (step === 3) return name.trim().length > 0;
    return true;
  };

  const handleNext = () => {
    if (step < 3) {
      setStep((s) => s + 1);
      return;
    }
    // 完成选择
    const config: PetConfig = {
      userId: 'local',
      species,
      featherColor,
      personality,
      gender,
      name: name.trim(),
      voiceStyle: 'soft',
      enableCamera: false,
      enableVoice: false,
    };
    setConfig(config);
    completeOnboarding();
    navigate('/dashboard');
  };

  return (
    <div
      className="w-screen h-screen flex flex-col items-center overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at 50% 30%, #1b2a4a 0%, #0d0d1a 100%)',
      }}
    >
      {/* 顶部进度 */}
      <div className="w-full max-w-sm px-6 pt-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-xl font-light">认识你的小鸟</h2>
          <span className="text-white/40 text-sm">{step + 1} / {STEPS.length}</span>
        </div>
        {/* 进度条 */}
        <div className="flex gap-1.5 mb-8">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="flex-1 h-1 rounded-full transition-all duration-500"
              style={{
                background: i <= step ? '#64B5F6' : 'rgba(255,255,255,0.15)',
              }}
            />
          ))}
        </div>
      </div>

      {/* 小鸟预览 */}
      <motion.div
        key={featherColor}
        initial={{ scale: 0.9, opacity: 0.7 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <PetSprite config={previewConfig} action="idle" size={130} />
        {name && (
          <p className="text-center text-white/70 text-sm mt-2">{name}</p>
        )}
      </motion.div>

      {/* 选项区域 */}
      <div className="w-full max-w-sm px-6 flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* Step 0: 种类 */}
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
                    onClick={() => setSpecies(s.id as Species)}
                    className={`
                      flex flex-col items-center justify-center
                      rounded-2xl py-4 gap-2
                      border-2 transition-all duration-200
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

          {/* Step 1: 毛色 */}
          {step === 1 && (
            <motion.div
              key="color"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="space-y-3"
            >
              <p className="text-white/60 text-sm mb-4">选一个颜色，让你的小鸟独一无二</p>
              {/* 性别 */}
              <div className="flex gap-3 mb-4">
                {(['female', 'male'] as const).map((g) => (
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
              {/* 颜色 */}
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

          {/* Step 2: 性格 */}
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
                  onClick={() => setPersonality(p.id as Personality)}
                  className={`
                    w-full flex items-center justify-between
                    rounded-2xl px-4 py-3
                    border-2 transition-all text-left
                    ${personality === p.id
                      ? 'border-blue-400 bg-blue-400/20'
                      : 'border-white/15 bg-white/5 hover:border-white/30'}
                  `}
                >
                  <div>
                    <div className="text-white font-medium">{p.label}</div>
                    <div className="text-white/50 text-xs mt-0.5">{p.desc}</div>
                  </div>
                  {personality === p.id && (
                    <div className="w-5 h-5 rounded-full bg-blue-400 flex items-center justify-center text-white text-xs">
                      ✓
                    </div>
                  )}
                </button>
              ))}
            </motion.div>
          )}

          {/* Step 3: 名字 */}
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
                  w-full
                  bg-white/10
                  border-2 border-white/20
                  rounded-2xl
                  px-4 py-3
                  text-white
                  placeholder-white/30
                  text-lg
                  text-center
                  outline-none
                  focus:border-blue-400
                  transition-colors
                "
                autoFocus
              />
              <p className="text-white/30 text-xs text-center">
                {name.length}/12
              </p>

              {/* 总结预览 */}
              <div className="mt-4 bg-white/5 rounded-2xl px-4 py-3 space-y-2">
                <p className="text-white/40 text-xs">你的选择：</p>
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

      {/* 底部按钮 */}
      <div className="w-full max-w-sm px-6 py-8 flex gap-3">
        {step > 0 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="
              flex-none px-5 py-3
              rounded-2xl
              border border-white/20
              text-white/70
              hover:border-white/40
              transition-colors
            "
          >
            上一步
          </button>
        )}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleNext}
          disabled={!canNext()}
          className={`
            flex-1 py-3
            rounded-2xl
            font-medium
            text-white
            transition-all duration-200
            ${canNext()
              ? 'bg-blue-500 hover:bg-blue-400'
              : 'bg-white/10 text-white/30 cursor-not-allowed'}
          `}
        >
          {step === 3 ? '开始养鸟 🐦' : '下一步'}
        </motion.button>
      </div>
    </div>
  );
};

export default PetSelection;

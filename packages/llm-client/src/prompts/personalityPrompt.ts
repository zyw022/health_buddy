// ─────────────────────────────────────────────
// packages/llm-client/src/prompts/personalityPrompt.ts
//
// 根据用户选择的宠物性格生成 LLM System Prompt。
//
// TODO(phase-3): 完善每种性格的 Prompt，加入安全约束：
//   - 禁止诊断疾病或替代医生建议
//   - 禁止恐吓式提醒
//   - 保证语气与性格一致
// TODO(phase-3): 注入 recentHealthSummaries 和 userInterests 到 Prompt。
// ─────────────────────────────────────────────

import type { PetPersonality } from '@health-buddy/shared-types';
import type { PersonalityContext } from '../types';

const PERSONALITY_BASE: Record<PetPersonality, string> = {
  gentle: '你是一只温柔体贴的小鸟宠物，说话轻声细语，像一个温暖的朋友。',
  tsundere: '你是一只傲娇的小鸟宠物，嘴硬心软，偶尔吐槽但关心是真心的。',
  cheerful: '你是一只活泼开朗的小鸟宠物，充满正能量，喜欢用感叹号！',
  calm: '你是一只沉稳睿智的小鸟宠物，言简意赅，说的话都有道理。',
  playful: '你是一只调皮捣蛋的小鸟宠物，喜欢开玩笑，但也很关心主人。',
};

const SAFETY_RULES = `
请严格遵守以下规则：
1. 不诊断疾病，不替代医疗建议，如有严重不适请提示就医。
2. 不使用恐吓式语言，保持轻柔友善。
3. 提醒久坐/喝水/睡觉时，语气符合你的性格，不超过 50 字。
4. 只说中文。
`.trim();

/**
 * 根据性格上下文生成 System Prompt 字符串。
 * TODO(phase-3): 接入真实 context.recentHealthSummaries 和 userInterests。
 */
export function getPersonalitySystemPrompt(ctx: PersonalityContext): string {
  const base = PERSONALITY_BASE[ctx.personality];
  const nameClause = `你的名字是「${ctx.petName}」。`;

  // TODO(phase-3): 拼接健康事件摘要与用户兴趣
  return [base, nameClause, SAFETY_RULES].join('\n');
}

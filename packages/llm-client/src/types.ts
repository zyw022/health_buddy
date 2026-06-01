// ─────────────────────────────────────────────
// packages/llm-client/src/types.ts
//
// LLM 客户端公共类型定义。
// TODO(phase-3): 按实际 API 响应格式完善字段。
// ─────────────────────────────────────────────

import type { PetPersonality } from '@health-buddy/shared-types';

/** 支持的 LLM Provider */
export type LLMProvider = 'deepseek' | 'openai';

/** 单条对话消息 */
export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** 调用选项 */
export interface LLMChatOptions {
  provider?: LLMProvider;
  model?: string;
  messages: LLMMessage[];
  /** 最大输出 token 数，默认 256 */
  maxTokens?: number;
  /** 超时毫秒，默认 8000 */
  timeoutMs?: number;
}

/** 调用结果 */
export interface LLMChatResult {
  content: string;
  /** 输出来源：LLM 成功 / 超时 fallback / 错误 fallback */
  source: 'llm' | 'fallback_timeout' | 'fallback_error';
  provider?: LLMProvider;
  usageTokens?: number;
}

/** 性格对话上下文 */
export interface PersonalityContext {
  personality: PetPersonality;
  petName: string;
  /** 最近 N 条健康事件描述，注入到 System Prompt */
  recentHealthSummaries?: string[];
  /** 用户偏好关键词（兴趣、音乐风格等） */
  userInterests?: string[];
}

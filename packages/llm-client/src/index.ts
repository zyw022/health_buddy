// ─────────────────────────────────────────────
// packages/llm-client — LLM API 封装层
//
// 职责：封装 DeepSeek / OpenAI 调用，供 pet-engine 和 health-engine 使用。
// 接口设计为 provider-agnostic，方便在 DeepSeek 和 OpenAI 之间切换。
//
// TODO(phase-3): 实现 chat()、streamChat() 调用 DeepSeek API。
// TODO(phase-3): 实现 getPersonalitySystemPrompt() 按性格生成 System Prompt。
// TODO(phase-3): 对话上下文管理（最近 10 条健康事件 + 用户偏好注入）。
// TODO(phase-3): 超时 8s / 重试 1 次；失败 fallback 到规则台词库。
// ─────────────────────────────────────────────

export type { LLMProvider, LLMChatOptions, LLMChatResult } from './types';
export { createLLMClient } from './client';
export { getPersonalitySystemPrompt } from './prompts/personalityPrompt';

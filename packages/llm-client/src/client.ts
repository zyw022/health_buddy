// ─────────────────────────────────────────────
// packages/llm-client/src/client.ts
//
// TODO(phase-3): 实现真实 HTTP 调用（fetch + AbortController 超时）。
// TODO(phase-3): 读取环境变量 DEEPSEEK_API_KEY / OPENAI_API_KEY。
// ─────────────────────────────────────────────

import type { LLMChatOptions, LLMChatResult, LLMProvider } from './types';

export interface LLMClient {
  chat(options: LLMChatOptions): Promise<LLMChatResult>;
}

export function createLLMClient(_provider: LLMProvider = 'deepseek'): LLMClient {
  return {
    // TODO(phase-3): 替换为真实 API 调用
    async chat(_options): Promise<LLMChatResult> {
      return {
        content: '',
        source: 'fallback_error',
      };
    },
  };
}

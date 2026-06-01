// ─────────────────────────────────────────────
// packages/pet-engine — 行为映射层 & 个性过滤器
//
// TODO(phase-2): 替换 apps/web/mock/petBehaviorMapping.ts，由 Dashboard 消费 PetTrigger。
// TODO(phase-3): applyPersonalityFilter 接入 packages/llm-client 生成台词。
// MVP 阶段：web 内 mock 映射 + 固定台词库即可。
// ─────────────────────────────────────────────

import type {
  HealthSnapshot,
  PetConfig,
  PetPersonality,
  PetTrigger,
  PetTriggerKind,
  UserPreferences,
} from '@health-buddy/shared-types';

// ── 行为状态机 ───────────────────────────────

/**
 * 根据健康快照与用户偏好，生成本周期内需要触发的宠物动作列表。
 * 返回的列表按优先级排序（high → normal → low）。
 */
export function evaluateTriggers(
  snapshot: HealthSnapshot,
  prefs: UserPreferences,
): PetTrigger[] {
  const triggers: PetTrigger[] = [];
  const { healthGoals } = prefs;

  // 久坐提醒
  if (snapshot.sedentaryMinutes >= healthGoals.sedentaryLimitMinutes) {
    triggers.push(makeTrigger('remind_move', 'high'));
  }

  // 喝水提醒（由上层传入布尔值，具体间隔逻辑在 health-engine 维护）
  if (snapshot.hydrationReminderDue) {
    triggers.push(makeTrigger('remind_drink', 'high'));
  }

  // 睡眠提醒：当前小时超过目标入睡时间 1 小时
  const currentHour = new Date(snapshot.ts).getHours();
  if (currentHour >= healthGoals.sleepTargetHour + 1) {
    triggers.push(makeTrigger('remind_sleep', 'normal'));
  }

  // 疲劳时播放音乐
  if (snapshot.fatigueScore >= 70 && !hasTrigger(triggers, 'remind_sleep')) {
    triggers.push(makeTrigger('play_music', 'normal'));
  }

  // 无任何提醒时，安静陪伴
  if (triggers.length === 0) {
    triggers.push(makeTrigger('idle_companion', 'low'));
  }

  return triggers.sort(byPriority);
}

// ── 个性过滤器 ───────────────────────────────

/**
 * 将触发类型 + 宠物配置转换为发送给 LLM 的系统提示词片段。
 * 调用方将此片段拼入完整 system prompt，再请求 LLM 生成台词。
 */
export function buildPersonalityPrompt(
  trigger: PetTrigger,
  config: PetConfig,
): string {
  const personalityDesc = PERSONALITY_PROMPTS[config.personality];
  const actionDesc = TRIGGER_DESCRIPTIONS[trigger.kind] ?? '与用户互动';

  return [
    `你是一只叫做「${config.name}」的桌面宠物小鸟，性别为${genderLabel(config.gender)}。`,
    `你的性格特点：${personalityDesc}`,
    `请用符合你性格的语气，完成以下任务：${actionDesc}`,
    '要求：简短（不超过40字），口语化，有个性，结尾可以加一个与性格匹配的感叹词或停顿。',
    '不要使用颜文字或 emoji。',
  ].join('\n');
}

// ── 内部常量 ─────────────────────────────────

const PERSONALITY_PROMPTS: Record<PetPersonality, string> = {
  gentle:
    '温柔、体贴、治愈系，说话轻声细语，常用"哦"、"呢"、"嗯"等语气词，让人感到被关心。',
  tsundere:
    '傲娇、嘴硬心软，表面吐槽实则在意主人，常说"哼"、"没办法"、"不是因为担心你"之类的话。',
  energetic:
    '活泼、元气满满，说话充满感叹号和冲劲，喜欢用"冲！"、"加油！"等词鼓励主人。',
  wise:
    '沉稳、智慧、老成持重，用词简练，给出建议时有理有据，像一位有阅历的老朋友。',
  cool:
    '冷淡、惜字如金，台词极短，但每句话都到位，偶尔流露出一丝温柔。',
};

const TRIGGER_DESCRIPTIONS: Record<PetTriggerKind, string> = {
  remind_move: '提醒主人已经坐了太久，让他站起来活动一下。',
  remind_drink: '提醒主人补充水分，好久没喝水了。',
  remind_sleep: '提醒主人时间不早了，该准备休息了。',
  celebrate_steps: '称赞主人今天的步数目标达成，表示开心。',
  play_music: '告诉主人你要给他放一首舒缓的音乐，让他放松一下。',
  tell_story: '给主人讲一个简短有趣的小故事开头，吸引他继续听。',
  idle_companion: '什么都没发生，就静静地陪着主人，说一句温馨或搞笑的话。',
  custom: '根据上下文自由发挥，与主人进行自然的互动。',
};

// ── 工具函数 ─────────────────────────────────

function makeTrigger(kind: PetTriggerKind, priority: PetTrigger['priority']): PetTrigger {
  return {
    id: `${kind}-${Date.now()}`,
    kind,
    priority,
  };
}

function hasTrigger(list: PetTrigger[], kind: PetTriggerKind): boolean {
  return list.some((t) => t.kind === kind);
}

function byPriority(a: PetTrigger, b: PetTrigger): number {
  const order = { high: 0, normal: 1, low: 2 };
  return order[a.priority] - order[b.priority];
}

function genderLabel(gender: PetConfig['gender']): string {
  return gender === 'male' ? '雄性' : gender === 'female' ? '雌性' : '未设定';
}

// ─────────────────────────────────────────────
// petBehaviorMapping.ts
//
// Phase 1 映射层：将健康快照转换为宠物动作 + 台词。
// MVP 使用本地台词库；完整版由 packages/pet-engine 输出 PetTrigger。
// TODO(phase-3): getPetMessage / getInteractionMessage 改为调用 packages/llm-client，
//               失败时 fallback 到本文件规则台词。
// ─────────────────────────────────────────────

import type { HealthSnapshot } from '@health-buddy/shared-types';

export type PetActionKey = 'idle' | 'yawn' | 'stretch' | 'happy' | 'worried' | 'sleep';

/**
 * 根据健康快照决定小鸟应该执行哪个动作。
 *
 * 优先级（高 → 低）：
 *   sleep > yawn > stretch > worried > happy > idle
 *
 * AC-5 映射规则（已固化）：
 *   23:00–06:00                              → sleep
 *   fatigueScore >= 75                       → yawn
 *   sedentaryMinutes >= 60                   → stretch
 *   stressScore >= 65 || hydrationReminderDue → worried
 *   fatigueScore < 30 && stressScore < 30    → happy（状态良好）
 *   其他                                     → idle
 */
export function mapHealthToAction(health: HealthSnapshot): PetActionKey {
  const hour = new Date().getHours();

  if (hour >= 23 || hour < 6) return 'sleep';
  if (health.fatigueScore >= 75) return 'yawn';
  if (health.sedentaryMinutes >= 60) return 'stretch';
  if (health.stressScore >= 65 || health.hydrationReminderDue) return 'worried';
  if (health.fatigueScore < 30 && health.stressScore < 30) return 'happy';
  return 'idle';
}

// ── 类型定义 ─────────────────────────────────

type Personality = 'gentle' | 'tsundere' | 'cheerful' | 'calm' | 'playful';

type DialogMap = Record<PetActionKey, string[]>;
type PersonalityDialogs = Record<Personality, DialogMap>;

// ── 性格台词库（每个动作 ≥ 3 条）────────────

const DIALOGS: PersonalityDialogs = {
  gentle: {
    idle: [
      '嗯，今天感觉怎么样呀？',
      '安静地陪着你，不打扰～',
      '有我在呢，放心工作吧。',
      '如果累了，记得告诉我哦。',
    ],
    yawn: [
      '看起来你很累了……早点休息吧？',
      '打哈欠了，是不是需要小憩一会儿？',
      '眼睛酸了的话，闭上眼睛放松一下吧。',
      '别撑着了，休息一下也没关系的。',
    ],
    stretch: [
      '坐太久了哦，站起来走几步？',
      '伸个懒腰，活动一下颈椎吧～',
      '已经坐了一个多小时了，去倒杯水怎么样？',
      '起来动动吧，我陪着你。',
    ],
    happy: [
      '今天状态不错嘛！继续保持～',
      '看你精力充沛的样子，真好！',
      '开心就好，我也跟着高兴了。',
      '你今天好像比平时更有活力哦！',
    ],
    worried: [
      '你压力有点大呢，要不要歇一歇？',
      '有什么烦恼可以跟我说的……',
      '该喝水了，别忘了补充水分哦。',
      '先放松一下吧，一切都会好的。',
    ],
    sleep: [
      '夜深了，快去睡觉吧！',
      '好好睡一觉，明天会更好的～',
      '我也困了……我们一起睡吧。',
      '放下手机，闭上眼睛，晚安～',
    ],
  },

  tsundere: {
    idle: [
      '哼，我不是在监视你，只是……顺便看看而已。',
      '别以为我很闲，我只是……没别的事做了。',
      '你在干嘛？不是好奇，就随口问问。',
      '哼哼……继续做你的事吧，我不打扰你。',
    ],
    yawn: [
      '呵，都累成这样了还不休息？真是的……要保重啊（小声）',
      '感觉你快撑不住了。不是担心你，就是觉得……看着不舒服。',
      '哼，要倒下了才知道休息……真是不让人省心。',
    ],
    stretch: [
      '哼，久坐对身体不好，这你不懂？赶紧起来！',
      '你知不知道坐这么久腰会出问题？……才不是关心你呢！',
      '站起来！腰椎会谢谢你的，不是我在管你啊！',
    ],
    happy: [
      '还好啦……今天状态还算凑合。',
      '哼，看你这副高兴劲，也没什么好嘚瑟的。',
      '唔……今天确实不错。不是因为我才这样的啊！',
    ],
    worried: [
      '你压力很大吧……虽然我不想管，但你还是喝点水吧。',
      '哼，不喝水的话等下头疼别来找我！',
      '你这个人……算了，先休息一下，别跟自己过不去。',
    ],
    sleep: [
      '都几点了还不睡？！……我才不是心疼你，是你明天会很蠢而已。',
      '去睡觉，不然我……不理你了。',
      '还不睡？！……（叹气）你最好给我睡好一点。',
    ],
  },

  cheerful: {
    idle: [
      '嗨嗨！今天也要加油哦！✨',
      '我在这里陪你！有我在就不孤单啦！',
      '哇，你在认真工作呀！超棒的！',
      '嘿！你有没有喝水？记得喝水鸭！',
    ],
    yawn: [
      '哎呀，是不是困啦？小憩一下充充电！',
      '打哈欠了！要不要做个五分钟的眼部操呀？',
      '困了就小睡一会儿！睡醒效率翻倍！',
    ],
    stretch: [
      '站起来！站起来！动一动！🎵',
      '坐久啦！我们来做个拉伸操吧！伸手！',
      '起来抖抖腿！血液循环起来！',
    ],
    happy: [
      '哇哇哇状态超好！今天一定能完成很多事！',
      '开心！我们都好厉害！继续加油！！',
      '你今天好厉害！精气神满满！我也跟着元气了！',
    ],
    worried: [
      '喝水喝水喝水！！水是最好的东西！💧',
      '有点累了哦！先暂停五分钟放空一下！',
      '感觉你有点撑不住了，快休息一下！元气值要充电了！',
    ],
    sleep: [
      '快去睡觉！睡眠是最好的美容液！',
      '晚安晚安！明天又是新的一天！✨',
      '去睡吧！今天辛苦啦！明天我们继续！',
    ],
  },

  calm: {
    idle: [
      '一切如常。',
      '专注是最高效的状态。',
      '工作中，不打扰你。',
      '保持节奏，稳步推进。',
    ],
    yawn: [
      '疲劳信号出现了。建议休息 10 分钟。',
      '你的专注力在下降，适当休息有益于效率。',
      '继续工作的边际收益已经递减，建议暂停。',
    ],
    stretch: [
      '连续坐超过一小时对脊椎有压力。建议站立活动。',
      '每工作 50 分钟，休息 10 分钟。这是 Pomodoro 原则。',
      '肌肉需要活动来保持血液循环。站起来走一圈。',
    ],
    happy: [
      '当前状态良好。',
      '保持这个节奏。',
      '身心俱佳，是高效工作的好时机。',
    ],
    worried: [
      '压力指标偏高，注意调整节奏。',
      '记得补水。脱水会降低认知能力。',
      '高压状态下容易出错，建议先做 5 分钟深呼吸。',
    ],
    sleep: [
      '已超过最佳睡眠时间，建议就寝。',
      '睡眠不足会显著影响次日效能。',
      '良好的睡眠是明天高效工作的基础。',
    ],
  },

  playful: {
    idle: [
      '嘿嘿，在干嘛呢偷偷看你～',
      '我在！我在！你有没有想我呀？',
      '无聊……要不要讲个冷笑话？',
      '嘿，你知道吗，盯着屏幕太久会变成方形眼睛哦！',
    ],
    yawn: [
      '哈～你打哈欠传染给我啦！一起睡觉？',
      '困了吧？快给我五秒钟——12345，不困了！（才怪）',
      '你要倒下了！我要喊救援！（假装慌张）好啦快去休息！',
    ],
    stretch: [
      '久坐提醒！罚你做十个深蹲！开个玩笑啦，站起来就好！',
      '屁股要坐烂了！快站起来！冲！',
      '来来来！跟我一起！向左扭——向右扭——活动颈椎！',
    ],
    happy: [
      '哇今天状态爆棚！是不是因为有我的功劳？对吧对吧！',
      '耶！高能预警！',
      '你今天眼睛都在发光！是吃了什么灵丹妙药吗？',
    ],
    worried: [
      '唉，你是不是忘记喝水了！我可是帮你记着的！',
      '来来来，深呼吸——吸——呼——好多了吧？',
      '你这个样子，我要开始担心你了！快休息！（认真脸）',
    ],
    sleep: [
      '快去睡觉！不然明天我要揪你耳朵！',
      '✨睡前三件事：洗脸刷牙关手机✨ 快去！',
      '再不睡我就去你被子里占位置了！（威胁）',
    ],
  },
};

// ── 点击互动专用台词（每种性格 3 条）──────────

const INTERACTION_DIALOGS: Record<Personality, string[]> = {
  gentle: [
    '嗯……我在这里呢。',
    '谢谢你来找我，我很高兴。',
    '有你真好。',
  ],
  tsundere: [
    '哼，你干嘛戳我……不是不开心啦！',
    '你这个人……算了，无视你！（没有在脸红）',
    '我、我不是在等你来点我的！才不是！',
  ],
  cheerful: [
    '哇你点我了！！我好开心啊！',
    '嗨！你注意到我啦！😄',
    '再点一下！再点一下！',
  ],
  calm: [
    '嗯，我注意到你了。',
    '有什么需要可以说。',
    '陪在你身边。',
  ],
  playful: [
    '哈！被我抓到了！干嘛干嘛？',
    '嘿嘿，想逗我呀？我不好骗的！',
    '哦哦，来互动啦！奖励你一个笑脸 😄',
  ],
};

// ── 公共函数 ─────────────────────────────────

/**
 * 根据健康状态、性格、当前动作，返回一条台词。
 * Phase 3 中此函数将调用 LLM 生成。
 */
export function getPetMessage(
  _health: HealthSnapshot,
  personality: string,
  action: PetActionKey,
): string {
  const p = (personality as Personality) in DIALOGS ? (personality as Personality) : 'gentle';
  const pool = DIALOGS[p][action];
  return pool[Math.floor(Math.random() * pool.length)] ?? '';
}

/**
 * 用户点击小鸟时的互动台词，覆盖全部 5 种性格。
 * Dashboard 应使用此函数替代硬编码字符串。
 */
export function getInteractionMessage(personality: string): string {
  const p =
    (personality as Personality) in INTERACTION_DIALOGS
      ? (personality as Personality)
      : 'gentle';
  const pool = INTERACTION_DIALOGS[p];
  return pool[Math.floor(Math.random() * pool.length)] ?? '';
}

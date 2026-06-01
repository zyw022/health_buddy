// ─────────────────────────────────────────────
// petBehaviorMapping.ts
//
// Phase 1 映射层：将健康快照转换为宠物动作 + 台词。
// MVP 使用本地台词库；完整版由 packages/pet-engine 输出 PetTrigger。
// TODO(phase-3): getPetMessage 改为调用 packages/llm-client，失败时 fallback 本文件规则台词。
// ─────────────────────────────────────────────

import type { HealthSnapshot } from '@health-buddy/shared-types';

export type PetActionKey = 'idle' | 'yawn' | 'stretch' | 'happy' | 'worried' | 'sleep';

/**
 * 根据健康快照决定小鸟应该执行哪个动作。
 * 优先级：极度疲劳 > 久坐超时 > 睡觉时段 > 水分不足 > 正常
 */
export function mapHealthToAction(health: HealthSnapshot): PetActionKey {
  const hour = new Date().getHours();

  if (hour >= 23 || hour < 6) return 'sleep';
  if (health.fatigueScore >= 75) return 'yawn';
  if (health.sedentaryMinutes >= 60) return 'stretch';
  if (health.stressScore !== undefined && health.stressScore >= 65) return 'worried';
  if (health.hydrationReminderDue) return 'worried';
  return 'idle';
}

// ── 性格台词库 ────────────────────────────────

type Personality = 'gentle' | 'tsundere' | 'cheerful' | 'calm' | 'playful';

type DialogMap = Record<PetActionKey, string[]>;
type PersonalityDialogs = Record<Personality, DialogMap>;

const DIALOGS: PersonalityDialogs = {
  gentle: {
    idle: [
      '嗯，今天感觉怎么样呀？',
      '安静的陪着你，不打扰～',
      '有我在呢，放心工作吧。',
      '如果累了，记得告诉我哦。',
    ],
    yawn: [
      '看起来你很累了……早点休息吧？',
      '打哈欠了，是不是需要小憩一会儿？',
      '眼睛酸了的话，闭上眼睛放松一下吧。',
    ],
    stretch: [
      '坐太久了哦，站起来走几步？',
      '伸个懒腰，活动一下颈椎吧～',
      '已经坐了一个多小时了，去倒杯水怎么样？',
    ],
    happy: [
      '今天状态不错嘛！',
      '看你精力充沛的样子，真好！',
      '开心就好，我也跟着高兴了。',
    ],
    worried: [
      '你压力有点大呢，要不要歇一歇？',
      '有什么烦恼可以跟我说的……',
      '该喝水了，别忘了补充水分哦。',
    ],
    sleep: [
      '夜深了，快去睡觉吧！',
      '好好睡一觉，明天会更好的～',
      '我也困了……我们一起睡吧。',
    ],
  },

  tsundere: {
    idle: [
      '哼，我不是在监视你，只是……顺便看看而已。',
      '别以为我很闲，我只是……没别的事做了。',
      '你在干嘛？不是好奇，就随口问问。',
    ],
    yawn: [
      '呵，都累成这样了还不休息？真是的……要保重啊（小声）',
      '感觉你快撑不住了。不是担心你，就是觉得……看着不舒服。',
    ],
    stretch: [
      '哼，久坐对身体不好，这你不懂？赶紧起来！',
      '你知不知道坐这么久腰会出问题？……才不是关心你呢！',
    ],
    happy: [
      '还好啦……今天状态还算凑合。',
      '哼，看你这副高兴劲，也没什么好嘚瑟的。',
    ],
    worried: [
      '你压力很大吧……虽然我不想管，但你还是喝点水吧。',
      '哼，不喝水的话等下头疼别来找我！',
    ],
    sleep: [
      '都几点了还不睡？！……我才不是心疼你，是你明天会很蠢而已。',
      '去睡觉，不然我……不理你了。',
    ],
  },

  cheerful: {
    idle: [
      '嗨嗨！今天也要加油哦！✨',
      '我在这里陪你！有我在就不孤单啦！',
      '哇，你在认真工作呀！超棒的！',
    ],
    yawn: [
      '哎呀，是不是困啦？小憩一下充充电！',
      '打哈欠了！要不要做个五分钟的眼部操呀？',
    ],
    stretch: [
      '站起来！站起来！动一动！🎵',
      '坐久啦！我们来做个拉伸操吧！伸手！',
    ],
    happy: [
      '哇哇哇状态超好！今天一定能完成很多事！',
      '开心！我们都好厉害！继续加油！！',
    ],
    worried: [
      '喝水喝水喝水！！水是最好的东西！💧',
      '有点累了哦！先暂停五分钟放空一下！',
    ],
    sleep: [
      '快去睡觉！睡眠是最好的美容液！',
      '晚安晚安！明天又是新的一天！✨',
    ],
  },

  calm: {
    idle: [
      '一切如常。',
      '专注是最高效的状态。',
      '工作中，不打扰你。',
    ],
    yawn: [
      '疲劳信号出现了。建议休息 10 分钟。',
      '你的专注力在下降，适当休息有益于效率。',
    ],
    stretch: [
      '连续坐超过一小时对脊椎有压力。建议站立活动。',
      '每工作 50 分钟，休息 10 分钟。这是 Pomodoro 原则。',
    ],
    happy: [
      '当前状态良好。',
      '保持这个节奏。',
    ],
    worried: [
      '压力指标偏高，注意调整节奏。',
      '记得补水。脱水会降低认知能力。',
    ],
    sleep: [
      '已超过最佳睡眠时间，建议就寝。',
      '睡眠不足会显著影响次日效能。',
    ],
  },

  playful: {
    idle: [
      '嘿嘿，在干嘛呢偷偷看你～',
      '我在！我在！你有没有想我呀？',
      '无聊……要不要讲个冷笑话？',
    ],
    yawn: [
      '哈～你打哈欠传染给我啦！一起睡觉？',
      '困了吧？快给我五秒钟——12345，不困了！（才怪）',
    ],
    stretch: [
      '久坐提醒！罚你做十个深蹲！开个玩笑啦，站起来就好！',
      '屁股要坐烂了！快站起来！冲！',
    ],
    happy: [
      '哇今天状态爆棚！是不是因为有我的功劳？对吧对吧！',
      '耶！高能预警！',
    ],
    worried: [
      '唉，你是不是忘记喝水了！我可是帮你记着的！',
      '来来来，深呼吸——吸——呼——好多了吧？',
    ],
    sleep: [
      '快去睡觉！不然明天我要揪你耳朵！',
      '✨睡前三件事：洗脸刷牙关手机✨ 快去！',
    ],
  },
};

/**
 * 根据健康状态、性格、当前动作，返回一条台词。
 * Phase 3 中此函数将调用 LLM 生成。
 */
export function getPetMessage(
  health: HealthSnapshot,
  personality: string,
  action: PetActionKey,
): string {
  const p = (personality as Personality) in DIALOGS ? (personality as Personality) : 'gentle';
  const pool = DIALOGS[p][action];
  return pool[Math.floor(Math.random() * pool.length)];
}

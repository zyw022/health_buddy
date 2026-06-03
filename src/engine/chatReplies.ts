import type { Personality } from '../store/types'

/** Keyword-based reply rules. First match wins. */
interface ReplyRule {
  keywords: string[]
  replies:  Record<Personality, string[]>
}

const RULES: ReplyRule[] = [
  {
    keywords: ['你好', '嗨', 'hi', 'hello', '早', '晚上好', '下午好'],
    replies: {
      coach:  ['嗯！准备好高效工作了吗？', '你好！今天的目标定好了吗？'],
      friend: ['嗨嗨～今天感觉怎么样？', '你好呀！能见到你真开心 ☀️'],
      roast:  ['哟，这么晚才来打招呼？', '哼，总算想起我了。'],
      healer: ['你好～我在这里陪着你 🌸', '嗨，今天也要好好的哦 💛'],
    },
  },
  {
    keywords: ['累', '疲惫', '好累', '困', '没劲', '乏'],
    replies: {
      coach:  ['感到累了？休息5分钟，然后继续！你能做到的。', '疲劳是成长的信号，稍作恢复再冲！'],
      friend: ['辛苦啦！要不要休息一会儿？我陪着你 🍵', '累了的话就歇歇嘛，不用逼自己太紧~'],
      roast:  ['就这点强度就累了？', '行吧，去躺着，反正你也不会继续工作的。'],
      healer: ['听到了，辛苦了 💗 深呼吸，让身体放松一下~', '感觉累了是身体在说话，好好休息吧 🌙'],
    },
  },
  {
    keywords: ['压力', '焦虑', '烦', '烦躁', '难受', '崩溃', '好烦'],
    replies: {
      coach:  ['压力是进步的动力！把大任务拆成小步骤，一步一步来。', '深呼吸，冷静分析，制定行动计划。'],
      friend: ['哎，说说看是什么让你烦呢？我在这里 🤗', '没关系的，有什么事情都可以跟我说~'],
      roast:  ['哦，又在焦虑了？这很正常，别太当真。', '焦虑就焦虑吧，反正焦虑也解决不了问题~'],
      healer: ['感受到你的不安了 💜 这种感觉很正常，慢慢来~', '深呼吸，你现在是安全的 🌿 我陪着你。'],
    },
  },
  {
    keywords: ['开心', '高兴', '棒', '不错', '好棒', '太好了', '耶', '哈哈'],
    replies: {
      coach:  ['不错！保持这个状态，继续冲！', '很好！正向情绪是高效工作的燃料。'],
      friend: ['哇，听到你开心我也好开心！发生什么好事啦～', '太棒了！分享一下是什么事？😄'],
      roast:  ['哦，难得见你笑啊。', '享受这个快乐吧，明天还得继续努力。'],
      healer: ['看到你开心，我也很幸福 🌟 把这份快乐留住哦~', '嘻嘻，开心的你最可爱啦 ✨'],
    },
  },
  {
    keywords: ['喝水', '水', '渴'],
    replies: {
      coach:  ['水分对认知能力至关重要！马上喝，目标每天8杯。', '去喝水！这是最简单的健康行动。'],
      friend: ['对对对，喝水很重要！我帮你记着哦 💧', '要喝水！一起养成好习惯～'],
      roast:  ['又来问喝水的事……就去喝啊！', '不喝水你等着脱水啊？'],
      healer: ['水是最温柔的养生方式 💧 慢慢喝，滋润一下身体吧~'],
    },
  },
  {
    keywords: ['步数', '走路', '运动', '锻炼', '跑步'],
    replies: {
      coach:  ['运动是最好的投资！每天一万步，身体倍儿棒。', '记录步数了吗？坚持就是胜利！'],
      friend: ['哇，去运动了？好棒！给你点赞 🏃', '运动完感觉怎么样？是不是特别清爽～'],
      roast:  ['哦，今天终于动了？', '难得见你运动，我都要感动了。'],
      healer: ['运动是身体给自己的礼物 🌿 你做得很好~', '动起来的感觉很美好对不对？继续保持 ☀️'],
    },
  },
  {
    keywords: ['睡眠', '睡觉', '失眠', '睡不着', '熬夜'],
    replies: {
      coach:  ['睡眠不足会严重影响效率！今晚务必在11点前睡。', '高质量睡眠 = 高效工作。立刻制定作息时间表！'],
      friend: ['睡不好好难受啊……今晚早点休息好不好？', '熬夜要注意哦，身体是革命的本钱 🌙'],
      roast:  ['熬夜？你不要命了？', '睡不着就数羊，别来找我说话了。'],
      healer: ['睡眠是对自己最温柔的照顾 🌙 今晚好好休息吧~', '失眠的话，可以试试深呼吸放松心情 💜'],
    },
  },
  {
    keywords: ['吃饭', '饿', '饥', '午饭', '早饭', '晚饭'],
    replies: {
      coach:  ['吃饭时间到！能量补充是高效工作的基础。', '按时吃饭，保持血糖稳定，才能持续专注！'],
      friend: ['肚子饿了吗？快去吃饭吧，吃饱才有力气嘛 🍜', '吃了吗？好好吃饭，照顾好自己～'],
      roast:  ['都几点了还没吃？', '饿着肚子工作效率还不如去吃饭。'],
      healer: ['好好吃饭是对身体最基本的爱护 🍀 慢慢品味每一口吧~'],
    },
  },
  {
    keywords: ['天气', '今天', '外面'],
    replies: {
      coach:  ['天气不是我们能控制的，但状态是！保持专注。', '不管天气怎样，今天的任务还是要完成的。'],
      friend: ['我也想知道外面天气呢！希望是个好天气 ☀️', '今天天气怎么样？适合出去走走吗？'],
      roast:  ['关我什么事，又不是天气预报。', '天气好坏又改变不了什么。'],
      healer: ['无论什么天气，你都是温暖的光 🌟', '好天气心情会更好，坏天气也有别样的美~'],
    },
  },
]

/** Fallback replies when no keyword matches */
const FALLBACK: Record<Personality, string[]> = {
  coach:  [
    '有什么具体目标要实现？我们一起制定计划！',
    '说说看，我帮你分析一下。',
    '专注当下，一次只做一件事。',
  ],
  friend: [
    '嗯嗯，我在听～说下去吧 😊',
    '哦哦，然后呢？',
    '我懂你的感受，你不是一个人~',
    '说说更多？我很想了解你哦 💬',
  ],
  roast: [
    '……就这？',
    '哼，有点意思。',
    '好吧，我勉强回应你一下。',
    '说完了？那我继续摸鱼了。',
  ],
  healer: [
    '谢谢你愿意跟我说话 🌸 我一直在这里。',
    '慢慢来，不用着急 💛',
    '你说的我都听到了 🌿',
    '感谢你分享这些，我们在一起 🌟',
  ],
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** Get a reply for a user message, simulating AI response */
export function getChatReply(message: string, personality: Personality): string {
  const lower = message.toLowerCase()
  for (const rule of RULES) {
    if (rule.keywords.some((k) => lower.includes(k))) {
      const options = rule.replies[personality]
      if (options?.length) return pickRandom(options)
    }
  }
  return pickRandom(FALLBACK[personality])
}

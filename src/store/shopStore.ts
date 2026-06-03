import { create } from 'zustand'
import { getElectronAPI } from './petStore'

export interface ShopItem {
  id:          string
  name:        string
  emoji:       string
  desc:        string
  price:       number   // seeds cost
  category:    'accessory' | 'toy' | 'food' | 'deco'
}

export interface PurchaseRecord {
  id:        string
  itemId:    string
  quantity:  number
  boughtAt:  string
}

interface ShopData {
  seeds:     number
  purchases: PurchaseRecord[]
}

interface ShopStore {
  seeds:     number
  purchases: PurchaseRecord[]
  loaded:    boolean
  load():    Promise<void>
  buy(item: ShopItem): Promise<boolean>
  earnSeeds(amount: number): Promise<void>
}

const FILE = 'shop.json'

// ── Shop catalogue (static) ───────────────────────────────────────────────────
export const SHOP_ITEMS: ShopItem[] = [
  { id:'hat_straw',   name:'草帽',     emoji:'🪖', desc:'让小鸟戴上可爱的草帽！',       price:80,  category:'accessory' },
  { id:'hat_crown',   name:'小皇冠',   emoji:'👑', desc:'尊贵感满满的像素皇冠。',       price:200, category:'accessory' },
  { id:'toy_ball',    name:'毛线球',   emoji:'🧶', desc:'小鸟最爱的玩具！',             price:50,  category:'toy'       },
  { id:'toy_mirror',  name:'小镜子',   emoji:'🪞', desc:'对着镜子唱歌更好听。',         price:120, category:'toy'       },
  { id:'food_millet', name:'小米粒',   emoji:'🌾', desc:'香喷喷的小米，美味加倍。',     price:30,  category:'food'      },
  { id:'food_berry',  name:'浆果',     emoji:'🍒', desc:'新鲜浆果，满满维生素！',       price:60,  category:'food'      },
  { id:'food_cake',   name:'生日蛋糕', emoji:'🎂', desc:'一年一次的特别惊喜。',         price:300, category:'food'      },
  { id:'deco_flower', name:'小花盆',   emoji:'🌷', desc:'摆在树屋里，芬芳四溢。',       price:90,  category:'deco'      },
  { id:'deco_lamp',   name:'萤火灯',   emoji:'🏮', desc:'夜里亮起来，温暖而神秘。',     price:150, category:'deco'      },
  { id:'deco_star',   name:'星星挂饰', emoji:'⭐', desc:'挂满树枝，像银河掉下来的。',   price:180, category:'deco'      },
]

export const useShopStore = create<ShopStore>((set, get) => ({
  seeds:     0,
  purchases: [],
  loaded:    false,

  load: async () => {
    const api = getElectronAPI()
    if (!api) return
    const data = await api.readData(FILE) as ShopData | null
    if (data) {
      set({ seeds: data.seeds ?? 0, purchases: data.purchases ?? [], loaded: true })
    } else {
      set({ seeds: 0, purchases: [], loaded: true })
    }
  },

  buy: async (item: ShopItem) => {
    const { seeds, purchases } = get()
    if (seeds < item.price) return false
    const record: PurchaseRecord = {
      id:       crypto.randomUUID(),
      itemId:   item.id,
      quantity: 1,
      boughtAt: new Date().toISOString(),
    }
    const newSeeds     = seeds - item.price
    const newPurchases = [record, ...purchases]
    set({ seeds: newSeeds, purchases: newPurchases })
    const api = getElectronAPI()
    await api?.writeData(FILE, { seeds: newSeeds, purchases: newPurchases })
    return true
  },

  earnSeeds: async (amount: number) => {
    const newSeeds = get().seeds + amount
    set({ seeds: newSeeds })
    const api = getElectronAPI()
    const purchases = get().purchases
    await api?.writeData(FILE, { seeds: newSeeds, purchases })
  },
}))

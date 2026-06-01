import type { PetAction, SpriteSheetDef } from '../store/types'

// All 4 sprite sheets are 1536×1024 with 3 horizontal frames (512×1024 each).
// Confirmed by pixel analysis: seam columns at x=512 and x=1024 are fully transparent in prompt.png,
// and all images show 3 visually distinct animation frames when split at cols=3.

export const SPRITE_CONFIG: Record<PetAction, SpriteSheetDef> = {
  idle:    { file: 'pets/birds/gentle/usual.png',  cols: 3, fps: 8  },
  happy:   { file: 'pets/birds/gentle/usual.png',  cols: 3, fps: 10 },
  talk:    { file: 'pets/birds/gentle/chat.png',   cols: 3, fps: 10 },
  yawn:    { file: 'pets/birds/gentle/tired.png',  cols: 3, fps: 6  },
  sleep:   { file: 'pets/birds/gentle/tired.png',  cols: 3, fps: 5  },
  worried: { file: 'pets/birds/gentle/prompt.png', cols: 3, fps: 8  },
  stretch: { file: 'pets/birds/gentle/prompt.png', cols: 3, fps: 8  },
}

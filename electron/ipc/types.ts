// IPC channel names and payload types — single source of truth for all IPC communication

export const IPC = {
  WINDOW_MOVE:        'window-move',
  PET_CONFIG_SAVE:    'pet-config-save',
  READ_DATA:          'read-data',
  WRITE_DATA:         'write-data',
  PET_ACTION_TRIGGER: 'pet-action-trigger',
  SHOW_SPEECH_BUBBLE: 'show-speech-bubble',
  ADD_WATER_RECORD:   'add-water-record',
  ADD_STEPS:          'add-steps',
  CREATE_PET_WINDOW:  'create-pet-window',
  CLOSE_TREEHOUSE:    'close-treehouse',
  SET_IGNORE_MOUSE:   'set-ignore-mouse-events',
  OPEN_TREEHOUSE:     'open-treehouse',
  PET_CONFIG_UPDATED: 'pet-config-updated',
  NOTIFY_PET_CONFIG:  'notify-pet-config',
  SHOW_PET_MENU:       'show-pet-menu',
  SHOW_TREEHOUSE_MENU: 'show-treehouse-menu',
  GLOBAL_MOUSE_MOVE:   'global-mouse-move',
  TRIGGER_PET_ACTION:  'trigger-pet-action',
  OPEN_CHAT:           'open-chat',
} as const

export type TreehouseRoute = 'entry' | 'report' | 'change-pet'

export type IpcChannel = typeof IPC[keyof typeof IPC]

export interface WindowMoveDelta {
  deltaX: number
  deltaY: number
}

export interface SpeechBubblePayload {
  text: string
  duration?: number
}

export interface WaterRecord {
  cups: number
}

export interface StepsRecord {
  steps: number
}

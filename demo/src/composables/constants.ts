
export const PROCEDURAL_STORAGE_KEY = 'procedural-texture-state'

export const TEXTURE_TYPES = {
    WOOD: 'Wood',
    PLAIN_WEAVE: 'PlainWeave',
    PLAIN_WEAVE_ADVANCED: 'Plain Weave Advanced',
    TWILL_WEAVE: 'TwillWeave',
    VELVET: 'Velvet'
} as const

export const TAB_NAMES = {
    UPLOAD: 'Upload',
    PROCEDURAL: 'Procedural',
    TEXT_TO_IMAGE: 'Text-to-Image'
} as const

export const DEFAULT_COLORS = {
    PLAIN_WEAVE_WARP: '#D4C8B8',
    PLAIN_WEAVE_WEFT: '#F0E8DC',
    TWILL_WEAVE_STOP_0: '#1a1a2e',
    TWILL_WEAVE_STOP_1: '#e0e0d0',
    TWILL_WEAVE_STOP_2: '#2c3e50',
    VELVET_STOP_0: '#2a0845',
    VELVET_STOP_1: '#5a3a7a',
    VELVET_STOP_2: '#8a6a9a'
} as const

export const PROCEDURAL_STATE_ERRORS = {
    LOAD_FAILED: 'Failed to load procedural texture state from localStorage:',
    SAVE_FAILED: 'Failed to save procedural texture state to localStorage:',
    UNKNOWN_TYPE: 'Unknown texture type:'
} as const

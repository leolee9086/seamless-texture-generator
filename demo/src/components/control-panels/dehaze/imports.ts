// Re-export types from parent directory
import type { ControlEvent } from '../../../types/controlEvents'
import { createUpdateDataEvent } from '../../../types/controlEvents'

// Re-export types from adjustments
import type { DehazeParams } from '../../../adjustments/dehaze/types'
import type { DehazePreset } from '../../../adjustments/dehaze/types'

// Re-export Vue types
import type { Ref, ComputedRef } from 'vue'

// Re-export Vue composables
import { ref, computed } from 'vue'

// Re-export Slider component types
import type { SliderItem } from '@leolee9086/slider-component'

// Re-export constants and functions from adjustments
import { BasicParamsUIDefine, AdvancedParamsUIDefine, EnhancementParamsUIDefine } from '../../../adjustments/dehaze/validateDehazeParams'
import { validateDehazeParams } from '../../../adjustments/dehaze/validateDehazeParams'
import { DEHAZE_PRESETS } from '../../../adjustments/dehaze/DEHAZE_PRESETS'
import { DEFAULT_DEHAZE_PARAMS, getDehazePreset } from '../../../adjustments/dehaze'

export type { ControlEvent, DehazeParams, DehazePreset, Ref, ComputedRef, SliderItem }
export {
  createUpdateDataEvent,
  ref,
  computed,
  BasicParamsUIDefine,
  AdvancedParamsUIDefine,
  EnhancementParamsUIDefine,
  validateDehazeParams,
  DEHAZE_PRESETS,
  DEFAULT_DEHAZE_PARAMS,
  getDehazePreset
}
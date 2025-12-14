// Re-export types from parent imports
import type { SliderItem } from '../imports'

// Re-export Vue Wrapper utilities
import { createComponentWrapper } from '../imports'
import type { VueComponent } from '../imports'

// Re-export Vue utilities
import { computed, ref, watch } from 'vue'
import type { ComputedRef } from 'vue'

// Re-export external components
import { Slider } from '../imports'

// Re-export composables
import { useProceduralTextureState } from '../imports'

// Re-export common components
// Re-export common components
import {
  GradientEditor,
  CollapsiblePanel,
  SliderParameterGroup,
  PresetSelector,
  GenerateButton,
} from '../imports'


import { generatePlainWeaveAdvancedTexture, defaultPlainWeaveAdvancedParams } from '../../../proceduralTexturing/fabrics/plainWeaveAdvanced/plainWeaveAdvancedGenerator'
import type { PlainWeaveAdvancedParams } from '../../../proceduralTexturing/fabrics/plainWeaveAdvanced/plainWeaveAdvanced.types'

export type { SliderItem, VueComponent, ComputedRef, PlainWeaveAdvancedParams }
export {
  createComponentWrapper,
  computed,
  ref,
  watch,
  Slider,
  useProceduralTextureState,
  GradientEditor,
  CollapsiblePanel,
  SliderParameterGroup,
  PresetSelector,
  GenerateButton,
  generatePlainWeaveAdvancedTexture,
  defaultPlainWeaveAdvancedParams
}
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
import {
  GradientEditor,
  CollapsiblePanel,
  SliderParameterGroup,
  PresetSelector,
  GenerateButton,
  generatePlainWeaveTexture
} from '../imports'

export type { SliderItem, VueComponent, ComputedRef }
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
  generatePlainWeaveTexture
}
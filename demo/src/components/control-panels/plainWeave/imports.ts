// Re-export types from parent imports
export type { SliderItem } from '../imports'

// Re-export Vue Wrapper utilities
export { createComponentWrapper } from '../imports'
export type { VueComponent } from '../imports'

// Re-export Vue utilities
export { computed, ref, watch } from 'vue'
export type { ComputedRef } from 'vue'

// Re-export external components
export { Slider } from '../imports'

// Re-export composables
export { useProceduralTextureState } from '../imports'

// Re-export common components
export {
  GradientEditor,
  CollapsiblePanel,
  SliderParameterGroup,
  PresetSelector,
  GenerateButton,
  generatePlainWeaveTexture
} from '../imports'
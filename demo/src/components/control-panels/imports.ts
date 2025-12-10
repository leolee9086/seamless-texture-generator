// UI Components
export { default as CollapsiblePanel } from '../common/CollapsiblePanel.vue'
export { default as SliderParameterGroup } from '../common/SliderParameterGroup.vue'
export { default as PresetSelector } from '../common/PresetSelector.vue'
export { default as GenerateButton } from '../common/GenerateButton.vue'

// External Components
export { Slider } from '@leolee9086/slider-component'
export type { SliderItem } from '@leolee9086/slider-component'

// Gradient Editor
export { default as GradientEditor } from '../gradient/GradientEditor.vue'

// Texture Generators
export { generatePlainWeaveTexture } from '../../proceduralTexturing/fabrics/plainWeave/plainWeaveGenerator'
export { generateTwillWeaveTexture } from '../../proceduralTexturing/fabrics/twillWeave/twillWeaveGenerator'
export { generateVelvetTexture } from '../../proceduralTexturing/fabrics/velvet/velvetGenerator'
export { generateLeatherTexture, defaultLeatherParams, type LeatherParams } from '../../proceduralTexturing/leather/leatherGenerator'
export { generateWoodTexture, type WoodParams } from '../../proceduralTexturing/wood/woodGeneratorPipeline'
export { generateFilmGradeTexture, defaultFilmParams, type FilmGradeTuringParams } from '../../proceduralTexturing/other/MultiscaleTuring/turingGenerator'

// Composables
export { useProceduralTextureState } from '../../composables/useProceduralTextureState'
export { useColorBlockSelector, type AdjustmentLayer } from '../../composables/useColorBlockSelector'

// Utils
export { getHslBlockColor } from '../../utils/lut/getHslBlockColor'
export type { RGBColor } from '../../utils/lut/colorQuantization'
export type { HSLRange } from '../../utils/lut/hslMask'

// Vue Wrapper
export { createComponentWrapper, withProps, withEmit, composeWrappers } from '../../utils/vue/wrapper'
export type { ComponentWrapperConfig, VueComponent } from '../../utils/vue/wrapper'

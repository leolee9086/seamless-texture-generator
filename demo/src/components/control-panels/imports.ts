// UI Components
import { default as CollapsiblePanel } from '../common/CollapsiblePanel.vue'
import { default as SliderParameterGroup } from '../common/SliderParameterGroup.vue'
import { default as PresetSelector } from '../common/presetButtons/PresetSelector.vue'
import { default as GenerateButton } from '../common/GenerateButton.vue'

// External Components
import { Slider } from '@leolee9086/slider-component'
import type { SliderItem } from '@leolee9086/slider-component'

// Gradient Editor
import { default as GradientEditor } from '../gradient/GradientEditor.vue'

// Texture Generators
import { generatePlainWeaveTexture } from '../../proceduralTexturing/fabrics/plainWeave/plainWeaveGenerator'
import { generateTwillWeaveTexture } from '../../proceduralTexturing/fabrics/twillWeave/twillWeaveGenerator'
import { generateVelvetTexture } from '../../proceduralTexturing/fabrics/velvet/velvetGenerator'
import { generateLeatherTexture, defaultLeatherParams, type LeatherParams } from '../../proceduralTexturing/leather/leatherGenerator'
import { generateWoodTexture, type WoodParams } from '../../proceduralTexturing/wood/woodGeneratorPipeline'
import { generateFilmGradeTexture, defaultFilmParams, type FilmGradeTuringParams } from '../../proceduralTexturing/other/MultiscaleTuring/turingGenerator'

// Composables
import { useProceduralTextureState } from '../../composables/useProceduralTextureState'
import { useColorBlockSelector, type AdjustmentLayer } from '../../composables/useColorBlockSelector'

// Utils
import { getHslBlockColor } from '../../utils/lut/getHslBlockColor'
import type { RGBColor } from '../../utils/lut/colorQuantization'
import type { HSLRange } from '../../utils/lut/hslMask'
import { isHTMLInputElement } from '../../utils/app-utils'

// Vue Wrapper
import { createComponentWrapper, withProps, withEmit, composeWrappers } from '../../utils/vue/wrapper'
import type { ComponentWrapperConfig, VueComponent } from '../../utils/vue/wrapper'

// Control Events
import type { ControlEvent } from '../../types/controlEvents'

export type { SliderItem, LeatherParams, WoodParams, FilmGradeTuringParams, AdjustmentLayer, RGBColor, HSLRange, ComponentWrapperConfig, VueComponent, ControlEvent }
export {
  CollapsiblePanel,
  SliderParameterGroup,
  PresetSelector,
  GenerateButton,
  Slider,
  GradientEditor,
  generatePlainWeaveTexture,
  generateTwillWeaveTexture,
  generateVelvetTexture,
  generateLeatherTexture,
  defaultLeatherParams,
  generateWoodTexture,
  generateFilmGradeTexture,
  defaultFilmParams,
  useProceduralTextureState,
  useColorBlockSelector,
  getHslBlockColor,
  isHTMLInputElement,
  createComponentWrapper,
  withProps,
  withEmit,
  composeWrappers
}

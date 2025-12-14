// Re-export types from parent imports
import type { SliderItem } from '../imports'

// Re-export Vue Wrapper utilities
import { createComponentWrapper } from '../imports'
import type { VueComponent } from '../imports'

// Re-export external components
import { Slider } from '../imports'

// Re-export composables
import { useProceduralTextureState } from '../imports'

// Re-export utils
import { horizontalScroll } from '../../../utils/common-utils'

// Re-export common components
import { default as horizontalScrollButtons } from '../../common/horizontalScrollButtons.vue'

// Re-export panel components
import { default as WoodPanel } from '../wood/WoodPanel.vue'
import { default as PlainWeavePanel } from '../plainWeave/PlainWeavePanel.vue'
import { createZeroBindingPlainWeavePanel } from '../plainWeave/PlainWeavePanel.wrapper.utils'
import { default as PlainWeaveAdvancedPanel } from '../plainWeaveAdvanced/PlainWeaveAdvancedPanel.vue'
import { createZeroBindingPlainWeaveAdvancedPanel } from '../plainWeaveAdvanced/PlainWeaveAdvancedPanel.wrapper.utils'
import { isValidImageDataArg } from '../plainWeave/PlainWeavePanel.guard'
import { default as LeatherPanel } from '../LeatherPanel.vue'
import { default as TwillWeavePanel } from '../TwillWeavePanel.vue'
import { default as VelvetPanel } from '../VelvetPanel.vue'
import { default as TuringPanel } from '../MultiscaleTuringPanel.vue'
import { default as GrayScottTuringPanel } from '../GrayScottTuringPanel.vue'
import { default as GrayscaleCompositorPanel } from '../GrayscaleCompositorPanel.vue'

// Re-export ModelScope API
import { submitGenerationTask, pollTaskUntilComplete } from '../../../api/modelscope.api'
import type { TaskStatusResponse } from '../../../api/types'

// Re-export image fetcher
import { fetchImageAsBase64 } from '../../../api/imageFetcher.api'

// Re-export API templates
import { buildProxyUrl } from '../../../api/templates'

// Re-export Vue reactivity APIs
import { ref, computed, watch, onMounted, type Ref, type ComputedRef } from 'vue'

export type { SliderItem, VueComponent, TaskStatusResponse, Ref, ComputedRef }
export {
  createComponentWrapper,
  Slider,
  useProceduralTextureState,
  horizontalScroll,
  horizontalScrollButtons,
  WoodPanel,
  PlainWeavePanel,
  createZeroBindingPlainWeavePanel,
  PlainWeaveAdvancedPanel,
  createZeroBindingPlainWeaveAdvancedPanel,
  isValidImageDataArg,
  LeatherPanel,
  TwillWeavePanel,
  VelvetPanel,
  TuringPanel,
  GrayScottTuringPanel,
  GrayscaleCompositorPanel,
  submitGenerationTask,
  pollTaskUntilComplete,
  fetchImageAsBase64,
  buildProxyUrl,
  ref,
  computed,
  watch,
  onMounted
}
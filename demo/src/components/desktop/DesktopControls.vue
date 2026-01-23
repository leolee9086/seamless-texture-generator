<template>
  <div class="flex flex-row h-full gap-4">
    <!-- Dock (Navigation) -->
    <div
      class="bg-black/60 flex flex-col items-center py-4 gap-3  backdrop-blur-xl  rounded-2xl shrink-0  shadow-2xl glass-panel border-r-black/90">
      <button v-for="group in groups" :key="group.id" @click="activeGroup = group.id"
        class="glass-btn bg-black/30 relative group w-12 h-12 flex items-center justify-center rounded-xxl transition-all duration-300 "
        :class="activeGroup === group.id ? 'text-blue shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'text-white/50 hover:text-white hover:bg-lightBlue/10'">

        <div
          :class="[group.icon, 'text-2xl transition-transform duration-300', activeGroup === group.id ? 'scale-110' : 'group-hover:scale-110']">
        </div>

        <!-- Tooltip -->
        <div
          class="absolute left-full ml-4 px-3 py-1.5 bg-black/90 border border-white/10 text-white text-xs font-medium rounded-lg opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 whitespace-nowrap pointer-events-none z-50 shadow-xl backdrop-blur-md">
          {{ group.label }}
          <!-- Arrow -->
          <div class="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-black/90"></div>
        </div>
      </button>
    </div>

    <!-- Content Area -->
    <div
      class="flex-1 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col min-w-0">



      <!-- Scrollable Content -->
      <div class="flex-1 overflow-y-auto scrollbar-hide p-6">
        <!-- Contact Panel -->
        <ContactPanel v-if="activeGroup === 'contact'" />

        <!-- Inputs Panel -->
        <component :is="wrappedInputsPanel" v-if="activeGroup === 'inputs'" />

        <!-- Crop Panel -->
        <CropPanel v-if="activeGroup === 'crop'" :original-image="originalImage"
          @open-sampling-editor="openSamplingEditor" />

        <!-- LUT Panel -->
        <LUTPanel v-else-if="activeGroup === 'lut'" :original-image="originalImage" :processed-image="processedImage"
          :lut-enabled="lutEnabled" :lut-intensity="lutIntensity" :lut-file-name="lutFileName" :lut-file="lutFile"
          @toggle-lut="toggleLUT" @lut-file-change="handleLUTFileChange" @clear-lut="clearLUT"
          @slider-update="handleSliderUpdate" @mask-update="handleMaskUpdate" @control-event="handleControlEvent" />

        <!-- HSL Panel -->
        <HSLPanel v-else-if="activeGroup === 'hsl'" :original-image="originalImage" :processed-image="processedImage"
          :global-hsl="globalHSL" :hsl-layers="hslLayers" @control-event="handleControlEvent" />

        <!-- Exposure Panel -->
        <ExposurePanel v-else-if="activeGroup === 'exposure'" :original-image="originalImage"
          :exposure-strength="exposureStrength" :exposure-manual="exposureManual" :exposure-mode="exposureMode"
          :clahe-config="claheConfig" @control-event="handleControlEvent" />

        <!-- Dehaze Panel -->
        <DehazePanel v-else-if="activeGroup === 'dehaze'" :original-image="originalImage" :dehaze-params="dehazeParams"
          @control-event="handleControlEvent" />

        <!-- Clarity Panel -->
        <ClarityPanel v-else-if="activeGroup === 'clarity'" :original-image="originalImage"
          @control-event="handleControlEvent" />

        <!-- Luminance Panel -->
        <LuminancePanel v-else-if="activeGroup === 'luminance'" :original-image="originalImage"
          :luminance-params="luminanceParams" @control-event="handleControlEvent" />

        <!-- Watermark Panel -->
        <WatermarkPanel v-else-if="activeGroup === 'watermark'" :original-image="originalImage"
          :watermark-config="watermarkConfig" :enable-watermark="enableWatermark" @control-event="handleControlEvent" />

        <!-- Settings Panel -->
        <SettingsPanel v-else-if="activeGroup === 'tileablesettings'" :is-processing="isProcessing"
          :original-image="originalImage" :settings-slider-items="settingsSliderItems" @process-image="processImage"
          @slider-update="handleSliderUpdate" />

        <!-- View Panel -->
        <ViewPanel v-else-if="activeGroup === 'view'" :original-image="originalImage" :processed-image="processedImage"
          :magnifier-enabled="magnifierEnabled" :view-slider-items="viewSliderItems" @reset-zoom="resetZoom"
          @toggle-magnifier="toggleMagnifier" @slider-update="handleSliderUpdate" />

        <!-- Save Panel -->
        <SavePanel v-else-if="activeGroup === 'save'" :original-image="originalImage" :processed-image="processedImage"
          :watermark-config="watermarkConfig" @save-original="saveOriginal" @save-result="saveResult"
          @control-event="handleControlEvent" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import '@leolee9086/slider-component/dist/slider-component.css'
import './DesktopControls.css'
import { useControlsLogic } from '../../composables/useControlsLogic'
import { useCanvasModeManager } from '../../composables/canvas-mode/index'
import { CANVAS_MODE_IDS } from '../../composables/canvas-mode/constants'
import type { DehazeParams } from '../../adjustments/dehaze/types'
import type { ClarityParams } from '../../adjustments/clarity'
import type { LuminanceAdjustmentParams } from '../../adjustments/luminance'
import ContactPanel from '../control-panels/ContactPanel.vue'
import { createZeroBindingInputsPanel } from '../control-panels/inputs/InputsPanel.wrapper.utils'
import CropPanel from '../control-panels/CropPanel.vue'
import LUTPanel from '../control-panels/lut/LUTPanel.vue'
import HSLPanel from '../control-panels/hsl/HSLPanel.vue'
import ExposurePanel from '../control-panels/ExposurePanel.vue'  // 新增导入
import DehazePanel from '../control-panels/dehaze/DehazePanel.vue'  // 新增导入
import ClarityPanel from '../control-panels/clarity/ClarityPanel.vue'  // 新增导入
import LuminancePanel from '../control-panels/LuminancePanel.vue'  // 新增导入
import WatermarkPanel from '../control-panels/watermark/WatermarkPanel.vue' // 新增导入
import SettingsPanel from '../control-panels/SettingsPanel.vue'
import ViewPanel from '../control-panels/ViewPanel.vue'
import SavePanel from '../control-panels/SavePanel.vue'

import type { 水印配置 } from '../control-panels/watermark/imports'

const props = defineProps<{
  isProcessing: boolean,
  originalImage: string | null,
  processedImage: string | null,
  maxResolution: number,
  borderSize: number,
  splitPosition: number,
  magnifierEnabled: boolean,
  zoomLevel: number,
  lutEnabled: boolean,
  lutIntensity: number,
  lutFileName: string | null,
  lutFile: File | null,
  globalHSL?: { hue: number; saturation: number; lightness: number },
  hslLayers?: any[]
  exposureStrength?: number
  exposureMode?: 'cdf' | 'clahe'
  claheConfig?: { clipLimit: number, blockSize: number, numBins: number }
  exposureManual?: { exposure: number; contrast: number; gamma: number }
  dehazeParams?: DehazeParams
  clarityParams?: ClarityParams
  luminanceParams?: LuminanceAdjustmentParams
  watermarkConfig?: 水印配置
  enableWatermark?: boolean
}>()

const emit = defineEmits<{
  controlEvent: [event: any]
}>()

const {
  activeGroup,
  groups: allGroups,
  inputSliderItems,
  settingsSliderItems,
  viewSliderItems,
  handleImageUpload,
  loadSampleImage,
  handleSliderUpdate,
  processImage,
  toggleMagnifier,
  resetZoom,
  openSamplingEditor,
  saveOriginal,
  saveResult,
  toggleLUT,
  handleLUTFileChange,
  clearLUT,
  handleMaskUpdate,
  setImage,
  handleControlEvent
} = useControlsLogic(props, emit)

// 画布模式管理器
const canvasModeManager = useCanvasModeManager()

// 效果调节器组ID列表（在程序化模式下需要禁用）
const EFFECT_ADJUSTMENT_GROUP_IDS = ['crop', 'lut', 'hsl', 'exposure', 'dehaze', 'clarity', 'luminance', 'watermark', 'tileablesettings']

// 根据画布模式过滤可用的调节器组
const groups = computed(() => {
  const currentMode = canvasModeManager.activeModeId.value
  
  // 程序化模式下，禁用效果调节器
  if (currentMode === CANVAS_MODE_IDS.PROCEDURAL) {
    return allGroups.filter(group => !EFFECT_ADJUSTMENT_GROUP_IDS.includes(group.id))
  }
  
  // 其他模式下，显示所有调节器
  return allGroups
})

const switchToGroup = (groupId: string) => {
  activeGroup.value = groupId
}

defineExpose({
  switchToGroup
})

// 创建零绑定包装后的 InputsPanel 组件
const wrappedInputsPanel = createZeroBindingInputsPanel({
  props: {
    isProcessing: props.isProcessing,
    originalImage: props.originalImage,
    inputSliderItems: props.inputSliderItems
  },
  emits: {
    'load-sample': loadSampleImage,
    'image-upload': handleImageUpload,
    'slider-update': handleSliderUpdate,
    'set-image': setImage
  }
})


</script>

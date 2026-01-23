<template>
  <div class="flex flex-col h-full relative">
    <!-- Header for Mobile (Fixed) -->
    <div class="flex items-center justify-between px-4 py-4 border-b border-white/5 flex-shrink-0">

      <div id="header-actions-container"></div>
    </div>

    <!-- Content Area (Scrollable) -->
    <div class="flex-1 overflow-y-auto scrollbar-hide min-h-0 px-4 pb-4">
      <div class="flex flex-col gap-6 pt-6">
        <!-- Contact Panel -->
        <ContactPanel v-if="activeGroup === 'contact'" is-mobile />

        <!-- Inputs Panel -->
        <InputsPanel v-else-if="activeGroup === 'inputs'" is-mobile :is-processing="isProcessing"
          :original-image="originalImage" :input-slider-items="inputSliderItems" @load-sample="loadSampleImage"
          @image-upload="handleImageUpload" @slider-update="handleSliderUpdate" @set-image="setImage" />

        <!-- Crop Panel -->
        <CropPanel v-else-if="activeGroup === 'crop'" is-mobile :original-image="originalImage"
          @open-sampling-editor="openSamplingEditor" />

        <!-- LUT Panel -->
        <LUTPanel v-else-if="activeGroup === 'lut'" is-mobile :original-image="originalImage"
          :processed-image="processedImage" :lut-enabled="lutEnabled" :lut-intensity="lutIntensity"
          :lut-file-name="lutFileName" :lut-file="lutFile" @toggle-lut="toggleLUT"
          @lut-file-change="handleLUTFileChange" @clear-lut="clearLUT" @slider-update="handleSliderUpdate"
          @mask-update="handleMaskUpdate" @control-event="emit('controlEvent', $event)" />

        <!-- HSL Panel -->
        <HSLPanel v-else-if="activeGroup === 'hsl'" is-mobile :original-image="originalImage"
          :processed-image="processedImage" :global-hsl="globalHSL" :hsl-layers="hslLayers"
          @control-event="emit('controlEvent', $event)" />

        <!-- Exposure Panel -->
        <ExposurePanel v-else-if="activeGroup === 'exposure'" is-mobile :original-image="originalImage"
          :exposure-strength="exposureStrength" :exposure-manual="exposureManual"
          @control-event="emit('controlEvent', $event)" />

        <!-- Dehaze Panel -->
        <DehazePanel v-else-if="activeGroup === 'dehaze'" is-mobile :original-image="originalImage"
          :dehaze-params="dehazeParams" @control-event="emit('controlEvent', $event)" />

        <!-- Clarity Panel -->
        <ClarityPanel v-else-if="activeGroup === 'clarity'" is-mobile :original-image="originalImage"
          @control-event="emit('controlEvent', $event)" />

        <!-- Luminance Panel -->
        <LuminancePanel v-else-if="activeGroup === 'luminance'" is-mobile :original-image="originalImage"
          :luminance-params="luminanceParams" @control-event="emit('controlEvent', $event)" />

        <!-- Settings Panel -->
        <SettingsPanel v-else-if="activeGroup === 'tileablesettings'" is-mobile :isProcessing="isProcessing"
          :original-image="originalImage" :settings-slider-items="settingsSliderItems" @process-image="processImage"
          @slider-update="handleSliderUpdate" />

        <!-- View Panel -->
        <ViewPanel v-else-if="activeGroup === 'view'" is-mobile :original-image="originalImage"
          :processed-image="processedImage" :magnifier-enabled="magnifierEnabled" :view-slider-items="viewSliderItems"
          @reset-zoom="resetZoom" @toggle-magnifier="toggleMagnifier" @slider-update="handleSliderUpdate" />

        <!-- Save Panel -->
        <SavePanel v-else-if="activeGroup === 'save'" is-mobile :original-image="originalImage"
          :processed-image="processedImage" @save-original="saveOriginal" @save-result="saveResult"
          @control-event="emit('controlEvent', $event)" />
      </div>
    </div>

    <!-- Secondary Navigation Container -->
    <div id="secondary-nav-container" class="w-full z-40 flex-shrink-0">
      <!-- Children should re-enable pointer-events -->
    </div>

    <!-- Bottom Navigation (Fixed Tab Bar) -->
    <div class="w-full z-50 bg-black border-t flex-shrink-0 pb-[env(safe-area-inset-bottom)]">
      <div ref="navContainer" class="flex items-center h-16 px-2 overflow-x-auto scrollbar-hide"
        @wheel="handleNavScroll">
        <button v-for="group in groups" :key="group.id" @click="activeGroup = group.id"
          class="flex flex-col items-center justify-center min-w-[80px] h-full gap-1 transition-colors duration-200 !bg-transparent !border-none !shadow-none !outline-none flex-shrink-0"
          :class="activeGroup === group.id ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'">

          <div :class="[
            group.icon,
            'text-2xl transition-transform duration-200',
            activeGroup === group.id ? 'scale-100' : 'scale-90'
          ]"></div>

          <span class="text-[10px] font-medium tracking-wide whitespace-nowrap">
            {{ group.label }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import '@leolee9086/slider-component/dist/slider-component.css'
import './MobileControls.css'
import { useControlsLogic } from '../../composables/useControlsLogic'
import { horizontalScroll } from '../../utils/common-utils'
import { useCanvasModeManager } from '../../composables/canvas-mode/index'
import { CANVAS_MODE_IDS } from '../../composables/canvas-mode/constants'
import type { DehazeParams } from '../../adjustments/dehaze/types'
import type { ClarityParams } from '../../adjustments/clarity'
import type { LuminanceAdjustmentParams } from '../../adjustments/luminance'
import ContactPanel from '../control-panels/ContactPanel.vue'
import InputsPanel from '../control-panels/inputs/InputsPanel.vue'
import CropPanel from '../control-panels/CropPanel.vue'
import LUTPanel from '../control-panels/lut/LUTPanel.vue'
import HSLPanel from '../control-panels/hsl/HSLPanel.vue'
import ExposurePanel from '../control-panels/ExposurePanel.vue'  // 新增导入
import DehazePanel from '../control-panels/dehaze/DehazePanel.vue'  // 新增导入
import ClarityPanel from '../control-panels/clarity/ClarityPanel.vue'  // 新增导入
import LuminancePanel from '../control-panels/LuminancePanel.vue'  // 新增导入
import SettingsPanel from '../control-panels/SettingsPanel.vue'
import ViewPanel from '../control-panels/ViewPanel.vue'
import SavePanel from '../control-panels/SavePanel.vue'

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
  exposureStrength?: number  // 新增
  exposureManual?: { exposure: number; contrast: number; gamma: number }  // 新增
  dehazeParams?: DehazeParams  // 新增
  clarityParams?: ClarityParams  // 新增
  luminanceParams?: LuminanceAdjustmentParams  // 新增
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
  setImage
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

const navContainer = ref<HTMLElement>()

const handleNavScroll = (event: WheelEvent) => {
  horizontalScroll(event)
}

</script>

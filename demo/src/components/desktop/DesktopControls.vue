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
        <InputsPanel v-else-if="activeGroup === 'inputs'" :is-processing="isProcessing" :original-image="originalImage"
          :input-slider-items="inputSliderItems" @load-sample="loadSampleImage" @image-upload="handleImageUpload"
          @slider-update="handleSliderUpdate" @set-image="setImage" />

        <!-- Crop Panel -->
        <CropPanel v-else-if="activeGroup === 'crop'" :original-image="originalImage"
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
          :exposure-strength="exposureStrength" :exposure-manual="exposureManual" @control-event="handleControlEvent" />

        <!-- Dehaze Panel -->
        <DehazePanel v-else-if="activeGroup === 'dehaze'" :original-image="originalImage" :dehaze-params="dehazeParams"
          @control-event="handleControlEvent" />

        <!-- Clarity Panel -->
        <ClarityPanel v-else-if="activeGroup === 'clarity'" :original-image="originalImage"
          @control-event="handleControlEvent" />

        <!-- Luminance Panel -->
        <LuminancePanel v-else-if="activeGroup === 'luminance'" :original-image="originalImage"
          :luminance-params="luminanceParams" @control-event="handleControlEvent" />

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
          @save-original="saveOriginal" @save-result="saveResult" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import '@leolee9086/slider-component/dist/slider-component.css'
import { useControlsLogic } from '../../composables/useControlsLogic'
import type { DehazeParams } from '../../adjustments/dehaze/types'
import type { ClarityParams } from '../../adjustments/clarityAdjustment'
import type { LuminanceAdjustmentParams } from '../../adjustments/luminanceAdjustment'
import ContactPanel from '../control-panels/ContactPanel.vue'
import InputsPanel from '../control-panels/InputsPanel.vue'
import CropPanel from '../control-panels/CropPanel.vue'
import LUTPanel from '../control-panels/LUTPanel.vue'
import HSLPanel from '../control-panels/HSLPanel.vue'
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
  groups,
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


</script>

<style scoped>
/* Override slider styles for glass theme */
.slider-container {
  --slider-track-bg: rgba(255, 255, 255, 0.1) !important;
  --slider-track-fill: rgba(255, 255, 255, 0.8) !important;
  --slider-thumb-bg: #fff !important;
  --slider-thumb-border: 2px solid rgba(255, 255, 255, 0.5) !important;
  --slider-text-color: rgba(255, 255, 255, 0.9) !important;
  padding: 0.5rem 0 !important;
}

.slider-label {
  font-size: 0.875rem !important;
  font-weight: 500 !important;
}

.slider-value {
  font-family: monospace !important;
  background: rgba(0, 0, 0, 0.3) !important;
  padding: 2px 6px !important;
  border-radius: 4px !important;
}
</style>

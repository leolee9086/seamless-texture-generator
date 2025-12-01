<template>
  <div class="flex flex-col h-full relative">
    <!-- Header for Mobile (Fixed) -->
    <div class="flex items-center gap-3 px-4 py-4 border-b border-white/5 flex-shrink-0">
      <div :class="[currentGroup?.icon, 'text-xl text-white/70']"></div>
      <div class="font-bold text-white tracking-wide">
        {{ currentGroup?.label }}
      </div>
    </div>

    <!-- Content Area (Scrollable) -->
    <div class="flex-1 overflow-y-auto scrollbar-hide min-h-0 px-4 pt-6 pb-28">
      <div class="flex flex-col gap-6">
        <!-- Contact Panel -->
        <ContactPanel v-if="activeGroup === 'contact'" is-mobile />

        <!-- Inputs Panel -->
        <InputsPanel v-else-if="activeGroup === 'inputs'" is-mobile :is-processing="isProcessing"
          :original-image="originalImage" :input-slider-items="inputSliderItems" @load-sample="loadSampleImage"
          @image-upload="handleImageUpload" @slider-update="handleSliderUpdate" />

        <!-- Crop Panel -->
        <CropPanel v-else-if="activeGroup === 'crop'" is-mobile :original-image="originalImage"
          @open-sampling-editor="openSamplingEditor" />

        <!-- LUT Panel -->
        <LUTPanel v-else-if="activeGroup === 'lut'" is-mobile :original-image="originalImage"
          :processed-image="processedImage" :lut-enabled="lutEnabled" :lut-intensity="lutIntensity"
          :lut-file-name="lutFileName" :lut-file="lutFile" @toggle-lut="toggleLUT"
          @lut-file-change="handleLUTFileChange" @clear-lut="clearLUT" @slider-update="handleSliderUpdate" />

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
          :processed-image="processedImage" @save-original="saveOriginal" @save-result="saveResult" />
      </div>
    </div>

    <!-- Bottom Navigation (Fixed Tab Bar) -->
    <div class="fixed bottom-0 left-0 right-0 z-50 bg-black border-t  pb-[env(safe-area-inset-bottom)]">
      <div class="flex items-center justify-around h-16 px-2">
        <button v-for="group in groups" :key="group.id" @click="activeGroup = group.id"
          class="flex flex-col items-center justify-center w-full h-full gap-1 transition-colors duration-200 !bg-transparent !border-none !shadow-none !outline-none"
          :class="activeGroup === group.id ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'">

          <div :class="[
            group.icon,
            'text-2xl transition-transform duration-200',
            activeGroup === group.id ? 'scale-100' : 'scale-90'
          ]"></div>

          <span class="text-[10px] font-medium tracking-wide">
            {{ group.label }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import '@leolee9086/slider-component/dist/slider-component.css'
import { useControlsLogic } from '../../composables/useControlsLogic'
import ContactPanel from '../control-panels/ContactPanel.vue'
import InputsPanel from '../control-panels/InputsPanel.vue'
import CropPanel from '../control-panels/CropPanel.vue'
import LUTPanel from '../control-panels/LUTPanel.vue'
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
  lutFile: File | null
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
} = useControlsLogic(props, emit)

const currentGroup = computed(() => groups.find(g => g.id === activeGroup.value))
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

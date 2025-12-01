<template>
  <div class="flex flex-col gap-4">
    <!-- Image Selection Group -->
    <div class="flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-gray-200">Image Source</span>
        <div class="flex gap-2">
          <button @click="loadSampleImage" :disabled="isProcessing" class="glass-btn text-xs py-1 px-3">
            Sample
          </button>
          <label class="glass-btn text-xs py-1 px-3 cursor-pointer flex items-center gap-1 hover:bg-glass-300">
            <div class="i-carbon-camera"></div>
            <span>Camera</span>
            <input type="file" accept="image/*" capture="environment" @change="handleImageUpload" class="hidden" />
          </label>
        </div>
      </div>

      <label class="glass-input flex items-center justify-between cursor-pointer hover:bg-glass-300 group">
        <span class="text-sm truncate opacity-80 group-hover:opacity-100">
          {{ originalImage ? 'Change Image' : 'Select Image' }}
        </span>
        <div class="i-carbon-image text-lg opacity-80"></div>
        <input type="file" accept="image/*" @change="handleImageUpload" class="hidden" />
      </label>
    </div>

    <!-- Controls Section -->
    <div v-if="originalImage || processedImage" class="flex flex-col gap-4 animate-fade-in">
      <!-- Sliders -->
      <div class="bg-darkglass-200 rounded-xl p-3 border border-glass-100">
        <Slider :items="sliderItems" @updateValue="handleSliderUpdate" />
      </div>

      <!-- Action Buttons -->
      <div class="grid grid-cols-2 gap-3">
        <button v-if="originalImage" @click="processImage" :disabled="isProcessing || !originalImage"
          class="glass-btn bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/30 w-full flex-center gap-2">
          <div v-if="isProcessing" class="i-carbon-circle-dash animate-spin"></div>
          <div v-else class="i-carbon-magic-wand"></div>
          <span>{{ isProcessing ? 'Processing...' : 'Make Seamless' }}</span>
        </button>

        <button v-if="originalImage" @click="resetZoom" class="glass-btn w-full flex-center gap-2">
          <div class="i-carbon-center-circle"></div>
          <span>Reset Zoom</span>
        </button>

        <button v-if="originalImage" @click="openSamplingEditor" class="glass-btn w-full flex-center gap-2">
          <div class="i-carbon-crop"></div>
          <span>Select Area</span>
        </button>
      </div>

      <div v-if="processedImage || originalImage" class="grid grid-cols-2 gap-3">
        <button v-if="originalImage" @click="saveOriginal"
          class="glass-btn w-full flex-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/30">
          <div class="i-carbon-image"></div>
          <span>Save Original</span>
        </button>

        <button v-if="processedImage" @click="saveResult"
          class="glass-btn w-full flex-center gap-2 bg-green-500/20 hover:bg-green-500/30 border-green-500/30">
          <div class="i-carbon-save"></div>
          <span>Save Result</span>
        </button>
      </div>

      <button v-if="processedImage" @click="toggleMagnifier" class="glass-btn w-full flex-center gap-2"
        :class="magnifierEnabled ? 'bg-purple-500/20 border-purple-500/30' : ''">
        <div class="i-carbon-zoom-in"></div>
        <span>{{ magnifierEnabled ? 'Disable Magnifier' : 'Enable Magnifier' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
//@ts-ignore
import { Slider } from '@leolee9086/slider-component'
import '@leolee9086/slider-component/dist/slider-component.css'
import { createButtonClickEvent, createUpdateDataEvent } from '../types/controlEvents'
import type { ControlEvent } from '../types/controlEvents'

const props = defineProps<{
  isProcessing: boolean,
  originalImage: string | null,
  processedImage: string | null,
  maxResolution: number,
  borderSize: number,
  splitPosition: number,
  magnifierEnabled: boolean,
  zoomLevel: number
}>()

// 创建滑块配置数据
const sliderItems = computed(() => {
  const items = []

  if (props.originalImage) {
    // 最大分辨率滑块
    items.push({
      id: 'max-resolution',
      label: 'Max Res',
      value: props.maxResolution,
      min: 512,
      max: 4096,
      step: 128,
      valuePosition: 'after' as const,
      showRuler: false
    })

    // 边界大小滑块
    items.push({
      id: 'border-size',
      label: 'Border (%)',
      value: props.borderSize,
      min: 5,
      max: 100,
      step: 1,
      valuePosition: 'after' as const,
      showRuler: false
    })

    // 缩放级别滑块
    items.push({
      id: 'zoom-level',
      label: 'Zoom',
      value: props.zoomLevel,
      min: 0.01,
      max: 5,
      step: 0.01,
      valuePosition: 'after' as const,
      showRuler: false
    })
  }

  if (props.processedImage) {
    // 分割线位置滑块
    items.push({
      id: 'split-position',
      label: 'Split Pos',
      value: props.splitPosition,
      min: 0,
      max: 1,
      step: 0.01,
      valuePosition: 'after' as const,
      showRuler: false
    })
  }

  return items
})

const emit = defineEmits<{
  controlEvent: [event: ControlEvent]
}>()

const handleImageUpload = (event: Event) => {
  emit('controlEvent', createUpdateDataEvent('image-upload', event))
}

const loadSampleImage = () => {
  emit('controlEvent', createButtonClickEvent('load-sample-image'))
}

const updateMaxResolution = (value: number) => {
  emit('controlEvent', createUpdateDataEvent('max-resolution', value))
}

const updateBorderSize = (value: number) => {
  emit('controlEvent', createUpdateDataEvent('border-size', value))
}

const processImage = () => {
  emit('controlEvent', createButtonClickEvent('process-image'))
}

const updateSplitPosition = (value: number) => {
  emit('controlEvent', createUpdateDataEvent('split-position', value))
}

const toggleMagnifier = () => {
  emit('controlEvent', createButtonClickEvent('toggle-magnifier'))
}

const updateZoomLevel = (value: number) => {
  emit('controlEvent', createUpdateDataEvent('zoom-level', value))
}

// 处理滑块值更新
const handleSliderUpdate = ({ id, value }: { id: string; value: number }) => {
  switch (id) {
    case 'max-resolution':
      updateMaxResolution(value)
      break
    case 'border-size':
      updateBorderSize(value)
      break
    case 'split-position':
      updateSplitPosition(value)
      break
    case 'zoom-level':
      updateZoomLevel(value)
      break
  }
}

const resetZoom = () => {
  emit('controlEvent', createButtonClickEvent('reset-zoom'))
}

const openSamplingEditor = () => {
  emit('controlEvent', createButtonClickEvent('open-sampling-editor'))
}

const saveOriginal = () => {
  emit('controlEvent', createButtonClickEvent('save-original'))
}

const saveResult = () => {
  emit('controlEvent', createButtonClickEvent('save-result'))
}
</script>

<style>
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

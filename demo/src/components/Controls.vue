<template>
  <div class="flex flex-col md:flex-row h-full gap-4">
    <!-- Dock (Navigation) -->
    <div
      class="flex md:flex-col justify-between md:justify-start gap-2 bg-darkglass-200/50 p-2 rounded-xl order-2 md:order-1 shrink-0">
      <button v-for="group in groups" :key="group.id" @click="activeGroup = group.id"
        class="p-3 rounded-lg transition-all duration-300 relative group flex items-center justify-center"
        :class="activeGroup === group.id ? 'bg-glass-300 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-glass-100'">
        <div :class="[group.icon, 'text-xl']"></div>
        <span
          class="absolute left-full ml-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 hidden md:block">
          {{ group.label }}
        </span>
      </button>
    </div>

    <!-- Content Area -->
    <div class="flex-1 overflow-y-auto scrollbar-hide order-1 md:order-2 min-h-0">
      <div class="flex flex-col gap-4 animate-fade-in h-full">

        <!-- Inputs Group -->
        <div v-if="activeGroup === 'inputs'" class="flex flex-col gap-4">
          <div class="text-lg font-bold text-white mb-2">Inputs</div>

          <!-- Image Source Selection -->
          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-gray-300">Source</span>
              <div class="flex gap-2">
                <button @click="loadSampleImage" :disabled="isProcessing" class="glass-btn text-xs py-1.5 px-3">
                  Sample
                </button>
                <label class="glass-btn text-xs py-1.5 px-3 cursor-pointer flex items-center gap-1 hover:bg-glass-300">
                  <div class="i-carbon-camera"></div>
                  <span>Camera</span>
                  <input type="file" accept="image/*" capture="environment" @change="handleImageUpload"
                    class="hidden" />
                </label>
              </div>
            </div>

            <label class="glass-input flex items-center justify-between cursor-pointer hover:bg-glass-300 group p-3">
              <div class="flex flex-col overflow-hidden">
                <span class="text-xs text-gray-400">Current Image</span>
                <span class="text-sm truncate text-gray-200 group-hover:text-white transition-colors">
                  {{ originalImage ? 'Change Image' : 'Select Image' }}
                </span>
              </div>
              <div class="i-carbon-image text-xl opacity-80 group-hover:scale-110 transition-transform"></div>
              <input type="file" accept="image/*" @change="handleImageUpload" class="hidden" />
            </label>
          </div>

          <!-- Max Resolution Slider -->
          <div v-if="originalImage" class="bg-darkglass-200 rounded-xl p-3 border border-glass-100">
            <Slider :items="inputSliderItems" @updateValue="handleSliderUpdate" />
          </div>
        </div>

        <!-- Crop Group -->
        <div v-if="activeGroup === 'crop'" class="flex flex-col gap-4">
          <div class="text-lg font-bold text-white mb-2">Crop & Sampling</div>

          <div v-if="!originalImage" class="text-center text-gray-400 py-8">
            Please select an image first
          </div>

          <div v-else class="flex flex-col gap-4">
            <p class="text-sm text-gray-300">
              Select a specific area of the image to use for texture generation.
            </p>
            <button @click="openSamplingEditor" class="glass-btn w-full flex-center gap-2 py-4 text-lg">
              <div class="i-carbon-crop text-xl"></div>
              <span>Open Crop Editor</span>
            </button>
          </div>
        </div>

        <!-- Settings Group -->
        <div v-if="activeGroup === 'tileablesettings'" class="flex flex-col gap-4">
          <div class="text-lg font-bold text-white mb-2">Generation Settings</div>

          <div v-if="!originalImage" class="text-center text-gray-400 py-8">
            Please select an image first
          </div>

          <div v-else class="flex flex-col gap-4">
            <div class="bg-darkglass-200 rounded-xl p-3 border border-glass-100">
              <Slider :items="settingsSliderItems" @updateValue="handleSliderUpdate" />
            </div>

            <button @click="processImage" :disabled="isProcessing"
              class="glass-btn bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/30 w-full flex-center gap-2 py-3">
              <div v-if="isProcessing" class="i-carbon-circle-dash animate-spin text-xl"></div>
              <div v-else class="i-carbon-magic-wand text-xl"></div>
              <span class="font-medium">{{ isProcessing ? 'Processing...' : 'Make Seamless' }}</span>
            </button>
          </div>
        </div>

        <!-- View Group -->
        <div v-if="activeGroup === 'view'" class="flex flex-col gap-4">
          <div class="text-lg font-bold text-white mb-2">View Options</div>

          <div v-if="!originalImage" class="text-center text-gray-400 py-8">
            Please select an image first
          </div>

          <div v-else class="flex flex-col gap-4">
            <div class="bg-darkglass-200 rounded-xl p-3 border border-glass-100">
              <Slider :items="viewSliderItems" @updateValue="handleSliderUpdate" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <button @click="resetZoom" class="glass-btn w-full flex-center gap-2">
                <div class="i-carbon-center-circle"></div>
                <span>Reset Zoom</span>
              </button>

              <button v-if="processedImage" @click="toggleMagnifier" class="glass-btn w-full flex-center gap-2"
                :class="magnifierEnabled ? 'bg-purple-500/20 border-purple-500/30' : ''">
                <div class="i-carbon-zoom-in"></div>
                <span>{{ magnifierEnabled ? 'Disable' : 'Enable' }} Magnifier</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Save Group -->
        <div v-if="activeGroup === 'save'" class="flex flex-col gap-4">
          <div class="text-lg font-bold text-white mb-2">Save & Export</div>

          <div v-if="!originalImage" class="text-center text-gray-400 py-8">
            Please select an image first
          </div>

          <div v-else class="flex flex-col gap-4">
            <button @click="saveOriginal"
              class="glass-btn w-full flex-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/30 py-4">
              <div class="i-carbon-image text-xl"></div>
              <div class="flex flex-col items-start">
                <span class="font-medium">Save Original</span>
                <span class="text-xs opacity-70">Download original image</span>
              </div>
            </button>

            <button v-if="processedImage" @click="saveResult"
              class="glass-btn w-full flex-center gap-2 bg-green-500/20 hover:bg-green-500/30 border-green-500/30 py-4">
              <div class="i-carbon-save text-xl"></div>
              <div class="flex flex-col items-start">
                <span class="font-medium">Save Result</span>
                <span class="text-xs opacity-70">Download seamless texture</span>
              </div>
            </button>
            <div v-else class="text-center text-gray-400 text-sm italic mt-2">
              Process the image to enable saving result
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
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

const activeGroup = ref('inputs')

const groups = [
  { id: 'inputs', icon: 'i-carbon-image-search', label: 'Inputs' },
  { id: 'crop', icon: 'i-carbon-crop', label: 'Crop' },
  { id: 'tileablesettings', icon: 'i-carbon-settings-adjust', label: 'Settings' },
  { id: 'view', icon: 'i-carbon-view', label: 'View' },
  { id: 'save', icon: 'i-carbon-save', label: 'Save' },
]

// Sliders for Inputs Group
const inputSliderItems = computed(() => {
  if (!props.originalImage) return []
  return [{
    id: 'max-resolution',
    label: 'Max Res',
    value: props.maxResolution,
    min: 512,
    max: 4096,
    step: 128,
    valuePosition: 'after' as const,
    showRuler: false
  }]
})

// Sliders for Settings Group
const settingsSliderItems = computed(() => {
  if (!props.originalImage) return []
  return [{
    id: 'border-size',
    label: 'Border (%)',
    value: props.borderSize,
    min: 5,
    max: 100,
    step: 1,
    valuePosition: 'after' as const,
    showRuler: false
  }]
})

// Sliders for View Group
const viewSliderItems = computed(() => {
  const items = []
  if (props.originalImage) {
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

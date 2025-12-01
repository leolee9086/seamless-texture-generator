<template>
  <DesktopControls v-if="!isMobile" v-bind="props" @controlEvent="emitControlEvent" />
  <MobileControls v-else v-bind="props" @controlEvent="emitControlEvent" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { isMobileDevice } from '../utils/deviceDetection'
import DesktopControls from './desktop/DesktopControls.vue'
import MobileControls from './mobile/MobileControls.vue'

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

const isMobile = computed(() => isMobileDevice())

const emitControlEvent = (event: any) => {
  emit('controlEvent', event)
}
</script>

<style>
/* 全局 slider 样式（保留） */
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

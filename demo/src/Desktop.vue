<template>
  <div
    class="w-screen h-screen bg-gradient-to-br from-gray-900 to-black text-white font-sans relative overflow-hidden flex flex-row"
    @dragenter.prevent="handleDragEnter" @dragleave.prevent="handleDragLeave" @dragover.prevent @drop.prevent="handleDrop">

    <!-- Controls Area (Left) -->
    <div class="z-20   m-4 mr-0 w-96 min-w-96 overflow-y-auto scrollbar-hide">
      <DesktopControls :is-processing="isProcessing" :original-image="originalImage" :processed-image="processedImage"
        :max-resolution="maxResolution" :border-size="borderSize" :split-position="splitPosition"
        :magnifier-enabled="magnifierEnabled" :zoom-level="zoomLevel" :lut-enabled="lutEnabled"
        :lut-intensity="lutIntensity" :lut-file-name="lutFileName" :lut-file="lutFile" :global-hsl="globalHSL"
        :hsl-layers="hslLayers" :exposure-strength="exposureStrength" :exposure-manual="exposureManual"
        :dehaze-params="dehazeParams" :clarity-params="clarityParams" :luminance-params="luminanceParams"
        @control-event="handleControlEvent" />
    </div>

    <!-- Viewer Area (Right) -->
    <div class="flex-1 relative z-0 overflow-hidden m-4 rounded-3xl shadow-inner bg-darkglass-200">
      <Viewer ref="viewerRef" :original-image="originalImage" :processed-image="processedImage"
        v-model:split-position="splitPosition" :magnifier-enabled="magnifierEnabled" :is-processing="isProcessing"
        :error-message="errorMessage" :zoom-level="zoomLevel" :preview-overlay="previewOverlay"
        @clear-overlay="clearPreviewOverlay" class="w-full h-full object-contain" />
    </div>

    <!-- Sampling Editor -->
    <SamplingEditor :visible="isSampling" :original-image="rawOriginalImage" @close="isSampling = false"
      @confirm="handleSamplingConfirmWrapper" />

    <!-- Drag Overlay -->
    <div v-if="isDragging"
      class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm border-4 border-dashed border-white/20 m-4 rounded-3xl transition-all duration-300">
      <div class="i-carbon-upload text-6xl text-white/80 mb-4 animate-bounce"></div>
      <p class="text-2xl font-light text-white/90">Release to Import Image</p>
    </div>

  </div>
</template>

<script setup lang="ts">
import DesktopControls from './components/desktop/DesktopControls.vue'
import Viewer from './components/Viewer.vue'
import { SamplingEditor } from './components/sampling-editor'
import { useTextureGenerator } from './composables/useTextureGenerator'
import { EVENT_TYPE, DATA_ACTION } from './utils/controlEventHandler.constants'
import { useGlobalDragDrop } from './composables/useGlobalDragDrop'

const { state: dragState, actions: dragActions } = useGlobalDragDrop((file) => {
  const reader = new FileReader()
  reader.onload = () => {
    if (typeof reader.result === 'string') {
      handleControlEvent({
        type: EVENT_TYPE.UPDATE_DATA,
        detail: {
          action: DATA_ACTION.SET_IMAGE,
          data: reader.result
        }
      })
    }
  }
  reader.readAsDataURL(file)
})

const { isDragging } = dragState
const { handleDragEnter, handleDragLeave, handleDrop } = dragActions

// 使用共享逻辑，启用摄像头功能
const {
  originalImage,
  rawOriginalImage,
  processedImage,
  borderSize,
  maxResolution,
  splitPosition,
  isProcessing,
  isSampling,
  errorMessage,
  viewerRef,
  zoomLevel,
  magnifierEnabled,
  lutEnabled,
  lutIntensity,
  lutFileName,
  lutFile,
  previewOverlay,
  globalHSL,
  hslLayers,
  exposureStrength,   // 新增
  exposureManual,     // 新增
  dehazeParams,      // 新增
  clarityParams,      // 新增
  luminanceParams,    // 新增
  clearPreviewOverlay,
  handleSamplingConfirmWrapper,
  handleControlEvent,
} = useTextureGenerator({
  enableCamera: true,
  initialMaxResolution: 4096,
  initialBorderSize: 0,
})
</script>

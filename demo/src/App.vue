<template>
  <div class="mobile-container flex flex-col h-screen w-screen overflow-hidden bg-black">

    <!-- Main Content -->
    <main class="flex-1 relative overflow-hidden flex flex-col md:flex-row">
      <!-- Controls Area -->
      <!-- Mobile: Bottom sheet, Desktop: Left sidebar -->
      <div
        class="z-20 m-4 mt-0 md:m-4 md:mr-0 md:w-96 max-h-[40vh] md:max-h-[calc(100vh-2rem)] flex flex-col order-2 md:order-1 transition-all duration-300 pointer-events-none">
        <MobileControls :is-processing="isProcessing" :original-image="originalImage" :processed-image="processedImage"
                :max-resolution="maxResolution" :border-size="borderSize" :split-position="splitPosition"
                :magnifier-enabled="magnifierEnabled" :zoom-level="zoomLevel" :lut-enabled="lutEnabled"
                :lut-intensity="lutIntensity" :lut-file-name="lutFileName" :lut-file="lutFile" @control-event="handleControlEvent"
                class="pointer-events-auto h-full" />
      </div>

      <!-- Viewer Area -->
      <div
        class="flex-1 relative z-0 overflow-hidden m-4 mt-0 md:m-4 rounded-3xl shadow-inner bg-darkglass-200 order-1 md:order-2">
        <Viewer ref="viewerRef" :original-image="originalImage" :processed-image="processedImage"
          v-model:split-position="splitPosition" :magnifier-enabled="magnifierEnabled" :is-processing="isProcessing"
          :error-message="errorMessage" :zoom-level="zoomLevel" class="w-full h-full object-contain" />
      </div>
    </main>

    <!-- Sampling Editor -->
    <SamplingEditor :visible="isSampling" :original-image="rawOriginalImage" @close="isSampling = false"
      @confirm="handleSamplingConfirmWrapper" />

    <!-- Debug Console (Hidden or minimized by default, maybe toggleable) -->
    <div class="fixed top-0 right-0 z-50 opacity-50 hover:opacity-100 pointer-events-none">
      <!--<DebugConsole />-->
    </div>
  </div>
</template>

<script setup lang="ts">
import MobileControls from './components/mobile/MobileControls.vue'
import Viewer from './components/Viewer.vue'
import SamplingEditor from './components/SamplingEditor.vue'
import { useTextureGenerator } from './composables/useTextureGenerator'

// 使用共享逻辑，禁用摄像头功能（移动端）
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
  handleSamplingConfirmWrapper,
  handleControlEvent,
} = useTextureGenerator({
  enableCamera: false,
  initialMaxResolution: 4096,
  initialBorderSize: 20,
})
</script>

<style>
/* Global scrollbar hide */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>

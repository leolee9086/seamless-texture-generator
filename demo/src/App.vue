<template>
  <div class="mobile-container flex flex-col">
    <!-- GitHub Link -->
    <a href="https://github.com/leolee9086/seamless-texture-generator" target="_blank" rel="noopener noreferrer"
      class="fixed top-4 left-4 z-30 w-10 h-10 flex items-center justify-center bg-gradient-to-br from-gray-700/80 to-gray-900/80 text-white rounded-full shadow-md transition-all duration-300 hover:shadow-lg hover:scale-110 active:scale-95backdrop-blur-sm"
      title="View on GitHub">
      <div class="i-carbon-logo-github text-xl"></div>
    </a>

    <!-- Main Content -->
    <main class="flex-1 relative overflow-hidden flex flex-col">
      <!-- Viewer Area -->
      <div class="flex-1 relative z-0 overflow-hidden m-4 mt-0 rounded-3xl shadow-inner bg-darkglass-200">
        <Viewer ref="viewerRef" :original-image="originalImage" :processed-image="processedImage"
          v-model:split-position="splitPosition" :magnifier-enabled="magnifierEnabled" :is-processing="isProcessing"
          :error-message="errorMessage" :zoom-level="zoomLevel" class="w-full h-full object-contain" />
      </div>

      <!-- Controls Area (Bottom Sheet style) -->
      <div class="z-20 p-4 glass-panel m-4 mt-0 max-h-[40vh] overflow-y-auto scrollbar-hide">
        <Controls :is-processing="isProcessing" :original-image="originalImage" :processed-image="processedImage"
          :max-resolution="maxResolution" :border-size="borderSize" :split-position="splitPosition"
          :magnifier-enabled="magnifierEnabled" :zoom-level="zoomLevel" @control-event="handleControlEvent" />
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
import Controls from './components/Controls.vue'
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

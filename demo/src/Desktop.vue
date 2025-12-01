<template>
    <div
        class="w-screen h-screen bg-gradient-to-br from-gray-900 to-black text-white font-sans relative overflow-hidden flex flex-row">

        <!-- Controls Area (Left) -->
        <div class="z-20   m-4 mr-0 w-96 min-w-96 overflow-y-auto scrollbar-hide">
            <Controls :is-processing="isProcessing" :original-image="originalImage" :processed-image="processedImage"
                :max-resolution="maxResolution" :border-size="borderSize" :split-position="splitPosition"
                :magnifier-enabled="magnifierEnabled" :zoom-level="zoomLevel" @control-event="handleControlEvent" />
        </div>

        <!-- Viewer Area (Right) -->
        <div class="flex-1 relative z-0 overflow-hidden m-4 rounded-3xl shadow-inner bg-darkglass-200">
            <Viewer ref="viewerRef" :original-image="originalImage" :processed-image="processedImage"
                v-model:split-position="splitPosition" :magnifier-enabled="magnifierEnabled"
                :is-processing="isProcessing" :error-message="errorMessage" :zoom-level="zoomLevel"
                class="w-full h-full object-contain" />
        </div>

        <!-- Sampling Editor -->
        <SamplingEditor :visible="isSampling" :original-image="rawOriginalImage" @close="isSampling = false"
            @confirm="handleSamplingConfirmWrapper" />

    </div>
</template>

<script setup lang="ts">
import Controls from './components/Controls.vue'
import Viewer from './components/Viewer.vue'
import SamplingEditor from './components/SamplingEditor.vue'
import { useTextureGenerator } from './composables/useTextureGenerator'

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
    handleSamplingConfirmWrapper,
    handleControlEvent,
} = useTextureGenerator({
    enableCamera: true,
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

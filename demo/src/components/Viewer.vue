<template>
  <div ref="containerRef" class="relative w-full h-full flex-center bg-darkglass-100">
    <!-- 预览覆盖层 -->
    <div v-if="previewOverlay" class="preview-overlay w-full h-full relative">
      <component :is="previewOverlay.component" v-bind="previewOverlay.data" />
      
      <!-- 退出按钮 -->
      <button @click="clearOverlay" class="exit-overlay-btn absolute top-4 right-4 z-30 glass-btn p-3 rounded-full bg-black/50 hover:bg-black/70 text-white/80 hover:text-white transition-colors flex items-center gap-2">
        <div class="i-carbon-close text-lg"></div>
        <span class="text-sm font-medium">退出预览</span>
      </button>
    </div>

    <!-- 原有的图像查看器 -->
    <div v-else-if="originalImage" class="w-full h-full relative">
      <SplitViewer ref="splitViewerRef" :leftImage="originalImage" :rightImage="processedImage || originalImage"
        :width="containerWidth" :height="containerHeight" :splitPosition="splitPosition" :magnifier="magnifierConfig"
        @split-change="handleSplitChange" @image-load="handleImageLoad" class="w-full h-full" />
    </div>

    <div v-if="isProcessing" class="absolute inset-0 z-10 flex-col-center bg-black/50 backdrop-blur-sm text-white">
      <div class="i-carbon-circle-dash animate-spin text-4xl mb-4 text-blue-400"></div>
      <div class="text-lg font-medium tracking-wide">Processing Image...</div>
    </div>

    <div v-if="errorMessage"
      class="absolute top-4 left-4 right-4 z-20 p-4 bg-red-500/20 border border-red-500/40 rounded-xl backdrop-blur-md text-red-200 flex items-center gap-3 animate-fade-in">
      <div class="i-carbon-warning-filled text-xl text-red-400"></div>
      <span>{{ errorMessage }}</span>
    </div>

    <div v-if="!originalImage && !isProcessing && !previewOverlay" class="flex-col-center text-white/30 gap-4">
      <div class="i-carbon-image text-6xl"></div>
      <div class="text-lg">No Image Selected</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { SplitViewer } from '@leolee9086/split-viewer'

import type { Component } from 'vue'

interface PreviewOverlayData {
  data: any
  component: Component
}

const props = defineProps<{
  originalImage: string | null,
  processedImage: string | null,
  splitPosition: number,
  magnifierEnabled: boolean,
  isProcessing: boolean,
  errorMessage: string,
  zoomLevel: number,
  previewOverlay?: PreviewOverlayData | null
}>()

const emit = defineEmits(['update:splitPosition', 'image-load', 'clear-overlay'])

const splitViewerRef = ref()
const containerRef = ref<HTMLElement | null>(null)
const containerWidth = ref(1000)
const containerHeight = ref(600)

let resizeObserver: ResizeObserver | null = null

const magnifierConfig = computed(() => ({
  enabled: props.magnifierEnabled,
  size: 150,
  zoomLevel: 2,
  followCursor: true
}))

const handleSplitChange = (position: number) => {
  emit('update:splitPosition', position)
}

const handleImageLoad = async (side: string) => {
  console.log('Image loaded:', side)

  // 确保在图像加载完成后应用当前的缩放级别
  if (side === 'all' || side === 'left') {
    await nextTick()
    if (splitViewerRef.value) {
      splitViewerRef.value.setZoom(props.zoomLevel)
    }
  }
}

const handleZoomChange = async () => {
  // 使用 nextTick 确保 DOM 更新完成后再调用方法
  await nextTick()
  if (splitViewerRef.value) {
    splitViewerRef.value.setZoom(props.zoomLevel)
  }
}

const resetZoom = async () => {
  // 使用 nextTick 确保 DOM 更新完成后再调用方法
  await nextTick()
  if (splitViewerRef.value) {
    splitViewerRef.value.resetZoom()
  }
}

const clearOverlay = () => {
  emit('clear-overlay')
}

watch(() => props.zoomLevel, handleZoomChange)

onMounted(() => {
  if (containerRef.value) {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        // Avoid 0 dimensions which might break canvas
        if (width > 0 && height > 0) {
          containerWidth.value = width
          containerHeight.value = height
        }
      }
    })
    resizeObserver.observe(containerRef.value)
  }
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})

defineExpose({
  resetZoom
})
</script>

<style>
/* Ensure SplitViewer canvas fits container */
.split-viewer-container canvas {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
</style>

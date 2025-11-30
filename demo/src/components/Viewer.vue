<template>
  <div class="relative w-full h-full flex-center bg-darkglass-100">
    <div v-if="originalImage" class="w-full h-full relative">
      <SplitViewer ref="splitViewerRef" :leftImage="originalImage" :rightImage="processedImage || originalImage"
        :width="1000" :height="600" :splitPosition="splitPosition" :magnifier="magnifierConfig"
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

    <div v-if="!originalImage && !isProcessing" class="flex-col-center text-white/30 gap-4">
      <div class="i-carbon-image text-6xl"></div>
      <div class="text-lg">No Image Selected</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { SplitViewer } from '@leolee9086/split-viewer'

const props = defineProps<{
  originalImage: string | null,
  processedImage: string | null,
  splitPosition: number,
  magnifierEnabled: boolean,
  isProcessing: boolean,
  errorMessage: string,
  zoomLevel: number
}>()

const emit = defineEmits(['update:splitPosition', 'image-load'])

const splitViewerRef = ref()

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

watch(() => props.zoomLevel, handleZoomChange)

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

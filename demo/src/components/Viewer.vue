<template>
  <div ref="containerRef" class="relative w-full h-full flex-center bg-darkglass-100">
    <!-- 预览覆盖层 -->
    <div v-if="previewOverlay" class="preview-overlay w-full h-full relative">
      <component :is="previewOverlay.component" v-bind="previewOverlay.data" />

      <!-- 退出按钮 -->
      <button @click="clearOverlay"
        class="exit-overlay-btn absolute top-4 right-4 z-30 glass-btn p-3 rounded-full bg-black/50 hover:bg-black/70 text-white/80 hover:text-white transition-colors flex items-center gap-2">
        <div class="i-carbon-close text-lg"></div>
        <span class="text-sm font-medium">退出预览</span>
      </button>
    </div>

    <!-- 原有的图像查看器 -->
    <div v-else-if="originalImage && containerWidth > 0 && containerHeight > 0" class="w-full h-full relative">
      <!-- 下载按钮 -->
      <button v-if="originalImage" @click="downloadOriginal"
        class="absolute top-4 left-4 z-20 glass-btn p-2 rounded-full bg-black/50 hover:bg-black/70 text-white/80 hover:text-white transition-colors"
        title="下载原始图像">
        <div class="i-carbon-download text-lg"></div>
      </button>
      
      <button v-if="processedImage" @click="downloadProcessedImage"
        class="absolute top-4 right-4 z-20 glass-btn p-2 rounded-full bg-black/50 hover:bg-black/70 text-white/80 hover:text-white transition-colors"
        title="下载处理后图像">
        <div class="i-carbon-download text-lg"></div>
      </button>

      <SplitViewer ref="splitViewerRef" :key="viewerKey" :leftImage="originalImage"
        :rightImage="processedImage || originalImage" :width="containerWidth" :height="containerHeight"
        :splitPosition="splitPosition" :magnifier="magnifierConfig" @split-change="handleSplitChange"
        @image-load="handleImageLoad" class="w-full h-full" />
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
import { SplitViewer, } from '@leolee9086/split-viewer'
import { saveOriginalImage, saveProcessedImage } from './common/imports'

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

const splitViewerRef = ref<typeof SplitViewer>()
const containerRef = ref<HTMLElement | null>(null)
const containerWidth = ref(0)
const containerHeight = ref(0)

let resizeObserver: ResizeObserver | null = null
let debounceTimer: number | null = null

const magnifierConfig = computed(() => ({
  enabled: props.magnifierEnabled,
  size: 150,
  zoomLevel: 2,
  followCursor: true
}))

// 生成 viewer key，只在初次尺寸设置时更新，避免后续每次 resize 都重新创建组件
const viewerKey = ref('viewer-initial')
const sizeInitialized = ref(false)

// 监听尺寸变化，只在首次初始化时更新 key
watch([containerWidth, containerHeight], ([newWidth, newHeight]) => {
  if (!sizeInitialized.value && newWidth > 0 && newHeight > 0) {
    viewerKey.value = `viewer-${newWidth}-${newHeight}`
    sizeInitialized.value = true
  }
})

const handleSplitChange = (position: number) => {
  emit('update:splitPosition', position)
}

const handleImageLoad = async (side: string) => {
  console.log('Image loaded:', side)

  // 确保在图像加载完成后应用当前的缩放级别
  if (side === 'all' || side === 'left') {
    await nextTick()
    // 这个问题似乎需要修改split-view组件,但是现在先用这个方法修复
    // 强制修复 Canvas 尺寸
    if (containerRef.value) {
      const canvas = containerRef.value.querySelector('canvas')
      if (canvas && (canvas.width === 300 || canvas.height === 150)) {
        console.log('Fixing canvas size manually', containerWidth.value, containerHeight.value)
        canvas.width = containerWidth.value
        canvas.height = containerHeight.value
      }
    }

    if (splitViewerRef.value) {
      // 强制重置内部状态
      if (typeof splitViewerRef.value.resetZoom === 'function') {
        splitViewerRef.value.resetZoom()
      }

      // 恢复缩放
      setTimeout(() => {
        if (splitViewerRef.value) {
          splitViewerRef.value.setZoom(props.zoomLevel)
        }
      }, 50)
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

const downloadOriginal = () => {
  if (props.originalImage) {
    saveOriginalImage(props.originalImage)
  }
}

const downloadProcessedImage = () => {
  if (props.processedImage) {
    saveProcessedImage(props.processedImage)
  }
}

watch(() => props.zoomLevel, handleZoomChange)

onMounted(() => {
  if (containerRef.value) {
    // 立即同步获取初始尺寸，避免使用默认的300x150
    const rect = containerRef.value.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) {
      containerWidth.value = rect.width
      containerHeight.value = rect.height
    }

    const DEBOUNCE_DELAY = 50 // 毫秒

    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        // Avoid 0 dimensions which might break canvas
        if (width > 0 && height > 0) {
          if (debounceTimer) clearTimeout(debounceTimer)
          debounceTimer = window.setTimeout(() => {
            containerWidth.value = width
            containerHeight.value = height
            // 触发 SplitViewer 重绘以确保 Canvas 内容正确显示
            if (splitViewerRef.value && typeof splitViewerRef.value.resetZoom === 'function') {
              splitViewerRef.value.resetZoom()
            }
          }, DEBOUNCE_DELAY)
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
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
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

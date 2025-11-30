<template>
  <div>
    <div class="viewer-container" v-show="originalImage">
      <SplitViewer ref="splitViewerRef" :leftImage="originalImage" :rightImage="processedImage || originalImage"
        :width="1000" :height="600" :splitPosition="splitPosition" :magnifier="magnifierConfig"
        @split-change="handleSplitChange" @image-load="handleImageLoad" />
    </div>

    <div class="loading" v-if="isProcessing">
      正在处理图像，请稍候...
    </div>

    <div class="error" v-if="errorMessage">
      {{ errorMessage }}
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
  console.log('图像加载完成:', side)
  
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

<style scoped>
.viewer-container {
  border: 1px solid #dee2e6;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.loading {
  text-align: center;
  padding: 2rem;
  font-size: 1.2rem;
  color: #6c757d;
}

.error {
  background-color: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 4px;
  margin-top: 1rem;
  border: 1px solid #f5c6cb;
}

@media (max-width: 768px) {
  .viewer-container {
    touch-action: pan-x pan-y pinch-zoom;
  }
}
</style>

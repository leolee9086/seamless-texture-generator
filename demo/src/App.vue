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
import { ref, onMounted } from 'vue'
import { processImageToTileable } from './utils/imageProcessor'
import {
  handleImageUpload,
  loadSampleImage,
  handleSamplingConfirm,
  toggleMagnifier,
  resetZoom,
  saveOriginal,
  saveResult
} from './utils/imageHandlers'
import { isMobileDevice } from './utils/deviceDetection'
import { watchImageChanges } from './utils/imageWatcher'
import Controls from './components/Controls.vue'
import Viewer from './components/Viewer.vue'
import SamplingEditor from './components/SamplingEditor.vue'
//import DebugConsole from './components/DebugConsole.vue'
import type { ControlEvent } from './types/controlEvents'
import { saveOriginalImage, saveProcessedImage } from './utils/download'

// 响应式数据
const originalImage = ref<string | null>(null)
const rawOriginalImage = ref<string | null>(null)
const processedImage = ref<string | null>(null)
const borderSize = ref(20)
const maxResolution = ref(4096) // 默认最大分辨率为4096
const splitPosition = ref(0.5)
const isProcessing = ref(false)
const isSampling = ref(false)
const errorMessage = ref('')
const viewerRef = ref()

// 移动端检测
const isMobile = ref(false)

// 缩放相关状态
const zoomLevel = ref(1)

// 放大镜配置
const magnifierEnabled = ref(true)

// 初始化时检测移动设备
onMounted(() => {
  isMobile.value = isMobileDevice()
})

// 统一的事件处理器
const handleControlEvent = (event: ControlEvent) => {
  const { type, detail } = event

  if (type === 'button-click') {
    switch (detail.action) {
      case 'load-sample-image':
        loadSampleImageWrapper()
        break
      case 'process-image':
        processImage()
        break
      case 'toggle-magnifier':
        toggleMagnifierWrapper()
        break
      case 'reset-zoom':
        resetZoomWrapper()
        break
      case 'save-result':
        saveResultWrapper()
        break
      case 'save-original':
        saveOriginalWrapper()
        break
      case 'open-sampling-editor':
        isSampling.value = true
        break
    }
  } else if (type === 'update-data') {
    switch (detail.action) {
      case 'image-upload':
        handleImageUploadWrapper(detail.data)
        break
      case 'max-resolution':
        maxResolution.value = detail.data
        break
      case 'border-size':
        borderSize.value = detail.data
        break
      case 'split-position':
        splitPosition.value = detail.data
        break
      case 'zoom-level':
        zoomLevel.value = detail.data
        break
    }
  }
}

// 处理图像上传
const handleImageUploadWrapper = (event: Event) => {
  handleImageUpload(event, (imageData: string) => {
    rawOriginalImage.value = imageData
    processedImage.value = null
    errorMessage.value = ''
  })
}

// 加载示例图像
const loadSampleImageWrapper = () => {
  loadSampleImage((imageData: string) => {
    rawOriginalImage.value = imageData
    processedImage.value = null
    errorMessage.value = ''
  })
}


// 监听原始图像和最大分辨率的变化，更新显示的图像
watchImageChanges(
  rawOriginalImage,
  maxResolution,
  originalImage,
  (message) => { errorMessage.value = message }
)

const handleSamplingConfirmWrapper = (imageData: string) => {
  handleSamplingConfirm(imageData, (updatedImageData: string) => {
    originalImage.value = updatedImageData
    processedImage.value = null
  })
}

// 处理图像
const processImage = async () => {
  if (!originalImage.value) return

  try {
    processedImage.value = await processImageToTileable(
      originalImage.value,
      maxResolution.value,
      borderSize.value,
      () => { isProcessing.value = true },
      () => { isProcessing.value = false },
      (message) => { errorMessage.value = message }
    )
  } catch (error) {
    console.error('处理图像时出错:', error)
  }
}

// 切换放大镜
const toggleMagnifierWrapper = () => {
  toggleMagnifier(magnifierEnabled.value, (enabled: boolean) => {
    magnifierEnabled.value = enabled
  })
}

const resetZoomWrapper = () => {
  resetZoom(() => {
    zoomLevel.value = 1
  }, viewerRef)
}

// 保存原始图像
const saveOriginalWrapper = () => {
  console.log('saveOriginal called', originalImage.value ? 'has image' : 'no image')
  saveOriginal(originalImage.value, saveOriginalImage)
  console.log('Download triggered with Blob')
}

// 保存结果
const saveResultWrapper = () => {
  saveResult(processedImage.value, saveProcessedImage)
}
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

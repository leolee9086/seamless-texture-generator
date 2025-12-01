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
      @confirm="handleSamplingConfirm" />

    <!-- Debug Console (Hidden or minimized by default, maybe toggleable) -->
    <div class="fixed top-0 right-0 z-50 opacity-50 hover:opacity-100 pointer-events-none">
      <!--<DebugConsole />-->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { makeTileable } from '../../src/lib/HistogramPreservingBlendMakeTileable'
import Controls from './components/Controls.vue'
import Viewer from './components/Viewer.vue'
import SamplingEditor from './components/SamplingEditor.vue'
//import DebugConsole from './components/DebugConsole.vue'
import type { ControlEvent } from './types/controlEvents'
import { saveOriginalImage, saveProcessedImage } from './utils/download'
import { scaleImageToMaxResolution, loadImage } from './utils/imageProcessing'

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
  const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  isMobile.value = mobile
})

// 统一的事件处理器
const handleControlEvent = (event: ControlEvent) => {
  const { type, detail } = event

  if (type === 'button-click') {
    switch (detail.action) {
      case 'load-sample-image':
        loadSampleImage()
        break
      case 'process-image':
        processImage()
        break
      case 'toggle-magnifier':
        toggleMagnifier()
        break
      case 'reset-zoom':
        resetZoom()
        break
      case 'save-result':
        saveResult()
        break
      case 'save-original':
        saveOriginal()
        break
      case 'open-sampling-editor':
        isSampling.value = true
        break
    }
  } else if (type === 'update-data') {
    switch (detail.action) {
      case 'image-upload':
        handleImageUpload(detail.data)
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
const handleImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      rawOriginalImage.value = e.target?.result as string
      processedImage.value = null
      errorMessage.value = ''
    }
    reader.readAsDataURL(file)
  }
}

// 加载示例图像
const loadSampleImage = () => {
  // 使用一个在线示例图像
  rawOriginalImage.value = 'https://picsum.photos/seed/texture/512/512.jpg'
  processedImage.value = null
  errorMessage.value = ''
}


// 监听原始图像和最大分辨率的变化，更新显示的图像
watch([rawOriginalImage, maxResolution], async ([newRaw, newMaxRes]: [string | null, number]) => {
  if (!newRaw) {
    originalImage.value = null
    return
  }

  try {
    const img = await loadImage(newRaw)
    const scaledCanvas = scaleImageToMaxResolution(img, newMaxRes)
    originalImage.value = scaledCanvas.toDataURL()
  } catch (error) {
    console.error('加载或缩放图像时出错:', error)
    errorMessage.value = '加载图像失败'
  }
})

const handleSamplingConfirm = (imageData: string) => {
  originalImage.value = imageData
  processedImage.value = null
}

// 处理图像
const processImage = async () => {
  if (!originalImage.value) return

  isProcessing.value = true
  errorMessage.value = ''

  try {
    // 创建图像元素
    const img = new Image()
    img.crossOrigin = 'anonymous'

    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
      img.src = originalImage.value!
    })

    // 先缩放图像到最大分辨率
    const scaledCanvas = scaleImageToMaxResolution(img, maxResolution.value)

    // 获取缩放后的图像数据
    const imageData = scaledCanvas.getContext('2d')!.getImageData(0, 0, scaledCanvas.width, scaledCanvas.height)

    // 处理图像
    const processedImageData = await makeTileable(imageData, borderSize.value, null)

    // 将处理后的图像数据转换为URL
    const processedCanvas = document.createElement('canvas')
    processedCanvas.width = processedImageData.width
    processedCanvas.height = processedImageData.height
    const processedCtx = processedCanvas.getContext('2d')!
    processedCtx.putImageData(processedImageData, 0, 0)

    processedImage.value = processedCanvas.toDataURL()
  } catch (error) {
    console.error('处理图像时出错:', error)
    errorMessage.value = `处理图像时出错: ${error instanceof Error ? error.message : '未知错误'}`
  } finally {
    isProcessing.value = false
  }
}

// 切换放大镜
const toggleMagnifier = () => {
  magnifierEnabled.value = !magnifierEnabled.value
}

const resetZoom = () => {
  zoomLevel.value = 1
  if (viewerRef.value) {
    viewerRef.value.resetZoom()
  }
}

// 保存原始图像
const saveOriginal = () => {
  console.log('saveOriginal called', originalImage.value ? 'has image' : 'no image')
  if (!originalImage.value) return
  saveOriginalImage(originalImage.value)
  console.log('Download triggered with Blob')
}

// 保存结果
const saveResult = () => {
  if (!processedImage.value) return
  saveProcessedImage(processedImage.value)
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

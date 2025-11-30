<template>
  <div class="container">
    <div class="controls">
      <div class="control-group">
        <label for="image-upload">选择图像:</label>
        <input id="image-upload" type="file" accept="image/*" @change="handleImageUpload" class="file-input" />
        <button @click="loadSampleImage" :disabled="isProcessing">
          加载示例图像
        </button>
        <button @click="toggleCamera" :disabled="isProcessing" class="camera-btn" v-if="!supportsNativeCamera">
          {{ cameraActive ? '关闭摄像头' : '打开摄像头' }}
        </button>
      </div>

      <!-- 摄像头组件 -->
      <CameraComponent v-model="cameraActive" @photo-captured="handlePhotoCaptured" @error="handleCameraError" />

      <div class="control-group" v-if="originalImage">
        <label for="max-resolution">最大分辨率:</label>
        <div class="slider-container">
          <input id="max-resolution" type="range" min="512" max="8192" step="512" v-model="maxResolution" class="slider" />
          <span>{{ maxResolution }}px</span>
        </div>
      </div>

      <div class="control-group" v-if="originalImage">
        <label for="border-size">边界大小 (%):</label>
        <div class="slider-container">
          <input id="border-size" type="range" min="5" max="100" v-model="borderSize" class="slider" />
          <span>{{ borderSize }}%</span>
        </div>
        <button @click="processImage" :disabled="isProcessing || !originalImage">
          {{ isProcessing ? '处理中...' : '开始无缝化处理' }}
        </button>
      </div>

      <div class="control-group" v-if="processedImage">
        <label for="split-position">分割线位置:</label>
        <div class="slider-container">
          <input id="split-position" type="range" min="0" max="1" step="0.01" v-model="splitPosition" class="slider" />
          <span>{{ (splitPosition * 100).toFixed(0) }}%</span>
        </div>
        <button @click="toggleMagnifier">
          {{ magnifierEnabled ? '关闭' : '开启' }}放大镜
        </button>
      </div>

      <!-- 缩放控制 - 移动端和桌面端都支持 -->
      <div class="control-group zoom-control" v-if="originalImage">
        <label for="zoom-level">缩放级别:</label>
        <div class="slider-container">
          <input id="zoom-level" type="range" min="0.1" max="5" step="0.1" v-model="zoomLevel" class="slider" />
          <span>{{ (zoomLevel * 100).toFixed(0) }}%</span>
        </div>
        <button @click="resetZoom">重置缩放</button>
      </div>
    </div>

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

    <!-- 调试控制台组件 -->
    <DebugConsole />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { SplitViewer } from '@leolee9086/split-viewer'
import { makeTileable } from '../../src/lib/HistogramPreservingBlendMakeTileable'
import CameraComponent from './components/CameraComponent.vue'
import DebugConsole from './components/DebugConsole.vue'

// 响应式数据
const originalImage = ref<string | null>(null)
const processedImage = ref<string | null>(null)
const borderSize = ref(20)
const maxResolution = ref(4096) // 默认最大分辨率为4096
const splitPosition = ref(0.5)
const isProcessing = ref(false)
const errorMessage = ref('')
const splitViewerRef = ref()

// 摄像头相关状态
const cameraActive = ref(false)
const supportsNativeCamera = ref(false)

// 移动端检测
const isMobile = ref(false)

// 缩放相关状态
const zoomLevel = ref(1)

// 检测是否支持原生相机
const checkNativeCameraSupport = () => {
  // 检测是否是移动设备
  const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  isMobile.value = mobile

  // 检测是否支持capture属性
  const hasCaptureSupport = 'capture' in document.createElement('input')

  // 移动设备通常支持原生相机
  supportsNativeCamera.value = mobile && hasCaptureSupport
}

// 初始化时检测相机支持
onMounted(() => {
  checkNativeCameraSupport()
})


// 放大镜配置
const magnifierEnabled = ref(true)
const magnifierConfig = computed(() => ({
  enabled: magnifierEnabled.value,
  size: 150,
  zoomLevel: 2,
  followCursor: true
}))

// 处理图像上传
const handleImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      originalImage.value = e.target?.result as string
      processedImage.value = null
      errorMessage.value = ''
    }
    reader.readAsDataURL(file)
  }
}

// 加载示例图像
const loadSampleImage = () => {
  // 使用一个在线示例图像
  originalImage.value = 'https://picsum.photos/seed/texture/512/512.jpg'
  processedImage.value = null
  errorMessage.value = ''
}

// 打开/关闭摄像头
const toggleCamera = () => {
  cameraActive.value = !cameraActive.value
}

// 处理摄像头拍照结果
const handlePhotoCaptured = (imageData: string) => {
  originalImage.value = imageData
  processedImage.value = null
  errorMessage.value = ''
}

// 处理摄像头错误
const handleCameraError = (message: string) => {
  errorMessage.value = message
}

// 缩放图像到指定最大分辨率
const scaleImageToMaxResolution = (img: HTMLImageElement, maxRes: number): HTMLCanvasElement => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  
  // 计算缩放比例
  const maxDimension = Math.max(img.width, img.height)
  
  // 如果图像尺寸小于等于最大分辨率，直接返回原图
  if (maxDimension <= maxRes) {
    canvas.width = img.width
    canvas.height = img.height
    ctx.drawImage(img, 0, 0)
    return canvas
  }
  
  // 计算缩放比例
  const scale = maxRes / maxDimension
  const newWidth = Math.round(img.width * scale)
  const newHeight = Math.round(img.height * scale)
  
  // 设置canvas尺寸
  canvas.width = newWidth
  canvas.height = newHeight
  
  // 使用高质量缩放
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  
  // 绘制缩放后的图像
  ctx.drawImage(img, 0, 0, newWidth, newHeight)
  
  return canvas
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

// 处理分割线变化
const handleSplitChange = (position: number) => {
  splitPosition.value = position
}

// 处理图像加载
const handleImageLoad = async (side: string) => {
  console.log('图像加载完成:', side)
  
  // 确保在图像加载完成后应用当前的缩放级别
  if (side === 'all' || side === 'left') {
    await nextTick()
    if (splitViewerRef.value) {
      splitViewerRef.value.setZoom(zoomLevel.value)
    }
  }
}

// 缩放相关方法
const handleZoomChange = async () => {
  // 使用 nextTick 确保 DOM 更新完成后再调用方法
  await nextTick()
  if (splitViewerRef.value) {
    console.log(splitViewerRef.value)
    splitViewerRef.value.setZoom(zoomLevel.value)
  }
}

const resetZoom = async () => {
  zoomLevel.value = 1
  // 使用 nextTick 确保 DOM 更新完成后再调用方法
  await nextTick()
  if (splitViewerRef.value) {
    splitViewerRef.value.resetZoom()
  }
}

// 监听缩放级别变化
watch(zoomLevel, handleZoomChange)
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  text-align: center;
  margin-bottom: 2rem;
  color: #333;
}

.controls {
  background-color: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.control-group {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.control-group:last-child {
  margin-bottom: 0;
}

label {
  font-weight: 500;
  min-width: 120px;
}

.file-input {
  flex: 1;
  min-width: 200px;
}

.slider-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 250px;
}

.slider {
  flex: 1;
}

button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background-color: #007bff;
  color: white;
  cursor: pointer;
  transition: background-color 0.2s;
}

button:hover:not(:disabled) {
  background-color: #0056b3;
}

button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.camera-btn {
  background-color: #28a745;
}

.camera-btn:hover:not(:disabled) {
  background-color: #218838;
}

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
  .control-group {
    flex-direction: column;
    align-items: stretch;
  }

  .slider-container {
    min-width: auto;
  }

  .mobile-zoom {
    background-color: #e9ecef;
    padding: 1rem;
    border-radius: 8px;
    margin-top: 1rem;
  }

  .viewer-container {
    touch-action: pan-x pan-y pinch-zoom;
  }
}
</style>
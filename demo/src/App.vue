<template>
  <div class="container">
    <h1>贴图无缝化演示</h1>
    
    <div class="controls">
      <div class="control-group">
        <label for="image-upload">选择图像:</label>
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          @change="handleImageUpload"
          class="file-input"
        />
        <button @click="loadSampleImage" :disabled="isProcessing">
          加载示例图像
        </button>
        <button @click="toggleCamera" :disabled="isProcessing" class="camera-btn">
          {{ cameraActive ? '关闭摄像头' : '打开摄像头' }}
        </button>
      </div>
      
      <!-- 摄像头组件 -->
      <CameraComponent
        v-model="cameraActive"
        @photo-captured="handlePhotoCaptured"
        @error="handleCameraError"
      />
      
      <div class="control-group" v-if="originalImage">
        <label for="border-size">边界大小 (%):</label>
        <div class="slider-container">
          <input 
            id="border-size"
            type="range" 
            min="5" 
            max="100" 
            v-model="borderSize"
            class="slider"
          />
          <span>{{ borderSize }}%</span>
        </div>
        <button 
          @click="processImage" 
          :disabled="isProcessing || !originalImage"
        >
          {{ isProcessing ? '处理中...' : '开始无缝化处理' }}
        </button>
      </div>
      
      <div class="control-group" v-if="processedImage">
        <label for="split-position">分割线位置:</label>
        <div class="slider-container">
          <input 
            id="split-position"
            type="range" 
            min="0" 
            max="1" 
            step="0.01"
            v-model="splitPosition"
            class="slider"
          />
          <span>{{ (splitPosition * 100).toFixed(0) }}%</span>
        </div>
        <button @click="toggleMagnifier">
          {{ magnifierEnabled ? '关闭' : '开启' }}放大镜
        </button>
      </div>
    </div>
    
    <div class="viewer-container" v-if="originalImage">
      <SplitViewer
        ref="splitViewerRef"
        :leftImage="originalImage"
        :rightImage="processedImage || originalImage"
        :width="1000"
        :height="600"
        :splitPosition="splitPosition"
        :magnifier="magnifierConfig"
        @split-change="handleSplitChange"
        @image-load="handleImageLoad"
      />
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
import { ref, computed } from 'vue'
import { SplitViewer } from '@leolee9086/split-viewer'
import { makeTileable } from '../../src/lib/HistogramPreservingBlendMakeTileable'
import CameraComponent from './components/CameraComponent.vue'
import DebugConsole from './components/DebugConsole.vue'

// 响应式数据
const originalImage = ref<string | null>(null)
const processedImage = ref<string | null>(null)
const borderSize = ref(20)
const splitPosition = ref(0.5)
const isProcessing = ref(false)
const errorMessage = ref('')
const splitViewerRef = ref()

// 摄像头相关状态
const cameraActive = ref(false)


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
    
    // 创建canvas并获取图像数据
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0)
    
    const imageData = ctx.getImageData(0, 0, img.width, img.height)
    
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
const handleImageLoad = (side: string) => {
  console.log('图像加载完成:', side)
}
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
}
</style>
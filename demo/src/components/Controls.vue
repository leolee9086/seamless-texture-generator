<template>
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
    <CameraComponent :modelValue="cameraActive" @update:modelValue="toggleCamera" @photo-captured="handlePhotoCaptured" @error="handleCameraError" />

    <div class="control-group" v-if="originalImage">
      <label for="max-resolution">最大分辨率:</label>
      <div class="slider-container">
        <input id="max-resolution" type="range" min="512" max="8192" step="512" :value="maxResolution" @input="updateMaxResolution" class="slider" />
        <span>{{ maxResolution }}px</span>
      </div>
    </div>

    <div class="control-group" v-if="originalImage">
      <label for="border-size">边界大小 (%):</label>
      <div class="slider-container">
        <input id="border-size" type="range" min="5" max="100" :value="borderSize" @input="updateBorderSize" class="slider" />
        <span>{{ borderSize }}%</span>
      </div>
      <button @click="processImage" :disabled="isProcessing || !originalImage">
        {{ isProcessing ? '处理中...' : '开始无缝化处理' }}
      </button>
    </div>

    <div class="control-group" v-if="processedImage">
      <label for="split-position">分割线位置:</label>
      <div class="slider-container">
        <input id="split-position" type="range" min="0" max="1" step="0.01" :value="splitPosition" @input="updateSplitPosition" class="slider" />
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
        <input id="zoom-level" type="range" min="0.1" max="5" step="0.1" :value="zoomLevel" @input="updateZoomLevel" class="slider" />
        <span>{{ (zoomLevel * 100).toFixed(0) }}%</span>
      </div>
      <button @click="resetZoom">重置缩放</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import CameraComponent from './CameraComponent.vue'

defineProps<{
  isProcessing: boolean,
  cameraActive: boolean,
  supportsNativeCamera: boolean,
  originalImage: string | null,
  processedImage: string | null,
  maxResolution: number,
  borderSize: number,
  splitPosition: number,
  magnifierEnabled: boolean,
  zoomLevel: number
}>()

const emit = defineEmits([
  'update:maxResolution',
  'update:borderSize',
  'update:splitPosition',
  'update:zoomLevel',
  'handleImageUpload',
  'loadSampleImage',
  'toggleCamera',
  'photoCaptured',
  'cameraError',
  'processImage',
  'toggleMagnifier',
  'resetZoom'
])

const handleImageUpload = (event: Event) => {
  emit('handleImageUpload', event)
}

const loadSampleImage = () => {
  emit('loadSampleImage')
}

const toggleCamera = () => {
  emit('toggleCamera')
}

const handlePhotoCaptured = (imageData: string) => {
  emit('photoCaptured', imageData)
}

const handleCameraError = (message: string) => {
  emit('cameraError', message)
}

const updateMaxResolution = (event: Event) => {
  emit('update:maxResolution', parseInt((event.target as HTMLInputElement).value))
}

const updateBorderSize = (event: Event) => {
  emit('update:borderSize', parseInt((event.target as HTMLInputElement).value))
}

const processImage = () => {
  emit('processImage')
}

const updateSplitPosition = (event: Event) => {
  emit('update:splitPosition', parseFloat((event.target as HTMLInputElement).value))
}

const toggleMagnifier = () => {
  emit('toggleMagnifier')
}

const updateZoomLevel = (event: Event) => {
  emit('update:zoomLevel', parseFloat((event.target as HTMLInputElement).value))
}

const resetZoom = () => {
  emit('resetZoom')
}
</script>

<style scoped>
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

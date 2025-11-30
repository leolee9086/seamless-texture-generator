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
    <CameraComponent :modelValue="cameraActive" @update:modelValue="toggleCamera" @photo-captured="handlePhotoCaptured"
      @error="handleCameraError" />

    <!-- 使用Slider组件替换原生滑块 -->
    <div class="slider-section" v-if="originalImage || processedImage">
      <Slider :items="sliderItems" @updateValue="handleSliderUpdate" />

      <!-- 处理按钮 -->
      <div class="control-group" v-if="originalImage">
        <button @click="processImage" :disabled="isProcessing || !originalImage">
          {{ isProcessing ? '处理中...' : '开始无缝化处理' }}
        </button>
      </div>

      <!-- 放大镜按钮 -->
      <div class="control-group" v-if="processedImage">
        <button @click="toggleMagnifier">
          {{ magnifierEnabled ? '关闭' : '开启' }}放大镜
        </button>
      </div>

      <!-- 重置缩放按钮 -->
      <div class="control-group zoom-control" v-if="originalImage">
        <button @click="resetZoom">重置缩放</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import CameraComponent from './CameraComponent.vue'
import { Slider } from '@leolee9086/slider-component'
import '@leolee9086/slider-component/dist/slider-component.css'
import { createButtonClickEvent, createUpdateDataEvent } from '../types/controlEvents'
import type { ControlEvent } from '../types/controlEvents'

const props = defineProps<{
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

// 创建滑块配置数据
const sliderItems = computed(() => {
  const items = []

  if (props.originalImage) {
    // 最大分辨率滑块
    items.push({
      id: 'max-resolution',
      label: '最大分辨率',
      value: props.maxResolution,
      min: 512,
      max: 8192,
      step: 512,
      valuePosition: 'after' as const,
      showRuler: false
    })

    // 边界大小滑块
    items.push({
      id: 'border-size',
      label: '边界大小 (%)',
      value: props.borderSize,
      min: 5,
      max: 100,
      step: 1,
      valuePosition: 'after' as const,
      showRuler: false
    })

    // 缩放级别滑块
    items.push({
      id: 'zoom-level',
      label: '缩放级别',
      value: props.zoomLevel,
      min: 0.1,
      max: 5,
      step: 0.1,
      valuePosition: 'after' as const,
      showRuler: false
    })
  }

  if (props.processedImage) {
    // 分割线位置滑块
    items.push({
      id: 'split-position',
      label: '分割线位置',
      value: props.splitPosition,
      min: 0,
      max: 1,
      step: 0.01,
      valuePosition: 'after' as const,
      showRuler: false
    })
  }

  return items
})

const emit = defineEmits<{
  controlEvent: [event: ControlEvent]
}>()

const handleImageUpload = (event: Event) => {
  emit('controlEvent', createUpdateDataEvent('image-upload', event))
}

const loadSampleImage = () => {
  emit('controlEvent', createButtonClickEvent('load-sample-image'))
}

const toggleCamera = () => {
  emit('controlEvent', createButtonClickEvent('toggle-camera'))
}

const handlePhotoCaptured = (imageData: string) => {
  emit('controlEvent', createUpdateDataEvent('photo-captured', imageData))
}

const handleCameraError = (message: string) => {
  emit('controlEvent', createUpdateDataEvent('camera-error', message))
}

const updateMaxResolution = (value: number) => {
  emit('controlEvent', createUpdateDataEvent('max-resolution', value))
}

const updateBorderSize = (value: number) => {
  emit('controlEvent', createUpdateDataEvent('border-size', value))
}

const processImage = () => {
  emit('controlEvent', createButtonClickEvent('process-image'))
}

const updateSplitPosition = (value: number) => {
  emit('controlEvent', createUpdateDataEvent('split-position', value))
}

const toggleMagnifier = () => {
  emit('controlEvent', createButtonClickEvent('toggle-magnifier'))
}

const updateZoomLevel = (value: number) => {
  emit('controlEvent', createUpdateDataEvent('zoom-level', value))
}

// 处理滑块值更新
const handleSliderUpdate = ({ id, value }: { id: string; value: number }) => {
  switch (id) {
    case 'max-resolution':
      updateMaxResolution(value)
      break
    case 'border-size':
      updateBorderSize(value)
      break
    case 'split-position':
      updateSplitPosition(value)
      break
    case 'zoom-level':
      updateZoomLevel(value)
      break
  }
}

const resetZoom = () => {
  emit('controlEvent', createButtonClickEvent('reset-zoom'))
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

.slider-section {
  margin-bottom: 1rem;
}

.slider-section .control-group {
  margin-top: 1rem;
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

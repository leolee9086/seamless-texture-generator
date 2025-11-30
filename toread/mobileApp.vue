<template>
  <div @dragover.prevent="handleDragOver" @drop.prevent="handleDrop" @dblclick="triggerFileInput"
    :class="{ 'drag-over': isDragOver }" class="mobile-upload-area">
    <input type="file" @change="loadImage" ref="fileInput" hidden />
    <div class="mobile-header">
      <h1>图像转纹理工具</h1>
      <button @click="captureFromCamera" class="camera-button">📷 拍照</button>
    </div>
    
    <div class="mobile-content">
      <div class="upload-prompt">双击或拖拽图片到此区域</div>
      
      <div class="map-preview-container">
        <mapPreviewer :imageData="previewerData" class="map-previewer"></mapPreviewer>
      </div>
      
      <div class="editor-tabs">
        <button 
          v-for="tab in 编辑器标签页" 
          :key="tab.id"
          @click="当前标签页 = tab.id"
          :class="{ active: 当前标签页 === tab.id }"
          class="tab-button"
        >
          {{ tab.name }}
        </button>
      </div>
      
      <div class="editor-container">
        <div v-show="当前标签页 === 'diffuse'" class="editor-panel">
          <diffuseMapEditor ref="diffuseMapEditorRef"></diffuseMapEditor>
        </div>
        
        <div v-show="当前标签页 === 'normal'" class="editor-panel">
          <NormalMapEditor ref="normalMapEditorRef"></NormalMapEditor>
        </div>
        
        <div v-show="当前标签页 === 'grayscale'" class="editor-panel">
          <GrayScaleMapEditor ref="grayScaleMapEditorRef"></GrayScaleMapEditor>
        </div>
        
        <div v-show="当前标签页 === 'preview'" class="editor-panel">
          <texturePreviewer
            ref="texturePreviewerRef"
            :diffuse-map-editor="diffuseMapEditorRef"
            :normal-map-editor="normalMapEditorRef"
            :gray-scale-map-editor="grayScaleMapEditorRef"
            class="texture-previewer"
          ></texturePreviewer>
        </div>
      </div>
      
      <div class="mobile-footer">
        <div class="upload-prompt">双击通道图可以保存当前贴图</div>
        <div class="upload-prompt">贴图无缝化算法来自unity-grenoble.github.io</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, provide, inject } from 'vue';
import { requestCameraPermission, captureImage, createVideoElement, removeVideoElement } from '../utils/webFiles/camera';
import { 是否为移动设备 } from '../utils/common-utils/device.ts';
import ColorThief from 'color-thief';
import chroma from 'chroma-js';
import * as statesConfig from '../states/states';
import { useStates } from '../states/statesMonitor';

// 导入组件
import GrayScaleMapEditor from './editors/grayScaleMapEditor.vue';
import NormalMapEditor from './editors/normalMapEditor.vue';
import diffuseMapEditor from './editors/diffuseMapEditor.vue';
import mapPreviewer from './previewers/mapPreviewer/mapPreviewer.vue';
import texturePreviewer from './previewers/texturePreviewer.vue';

// 初始化状态管理
const statesManager = useStates(statesConfig, 'mobileApp');

// 提供状态管理器和配置
provide("statesManager", statesManager);
provide("statesConfig", statesConfig);

// 组件状态
const fileInput = ref(null);
const isDragOver = ref(false);
const imageLoaded = ref(false);
const 当前标签页 = ref('diffuse');

// 编辑器标签页配置
const 编辑器标签页 = ref([
  { id: 'diffuse', name: '固有色' },
  { id: 'normal', name: '法线' },
  { id: 'grayscale', name: 'AO' },
  { id: 'preview', name: '预览' }
]);

// 编辑器组件引用
const diffuseMapEditorRef = ref(null);
const normalMapEditorRef = ref(null);
const grayScaleMapEditorRef = ref(null);
const texturePreviewerRef = ref(null);

// 状态管理
const rawMap = statesManager.get(statesConfig.rawMap);
provide('rawMap', rawMap);

const previewerData = ref(null);
provide('previewerData', previewerData);

function updatePreview(data) {
  previewerData.value = data;
}

provide('updatePreview', updatePreview);

const normalMapData = ref(null);
provide('normalMapData', normalMapData);

function updateNormalMapData(data) {
  normalMapData.value = data;
}

provide('updateNormalMapData', updateNormalMapData);

const AOMapData = ref(null);
provide('AOMapData', AOMapData);

function updateAOMapData(data) {
  AOMapData.value = data;
}

provide('updateAOMapData', updateAOMapData);

// 事件处理函数
function loadImage(event) {
  const file = event.target && event.target.files ? event.target.files[0] : event;
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        imageLoaded.value = true;
        rawMap.value = img;
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
}

function handleDragOver() {
  isDragOver.value = true;
}

function handleDrop(event) {
  isDragOver.value = false;
  loadImage(event.dataTransfer.files[0]);
}

function triggerFileInput() {
  fileInput.value.click();
}

// 使用摄像头拍照
const captureFromCamera = async () => {
  try {
    const stream = await requestCameraPermission();
    const video = createVideoElement();
    const img = await captureImage(stream, video);
    removeVideoElement(video);
    
    imageLoaded.value = true;
    rawMap.value = img;
  } catch (error) {
    console.error('拍照失败:', error);
    alert('无法访问摄像头，请确保已授予摄像头权限并检查设备是否支持。');
  }
};

// 监听原始图像变化
watch([rawMap], () => {
  const img = rawMap.value;
  if (img) {
    document.body.style.backgroundImage = `url(${img.src})`;
    document.body.style.backgroundSize = '128px';
    document.body.style.backgroundRepeat = 'repeat, repeat, repeat';
    
    const colorThief = new ColorThief();
    try {
      const dominantColor = colorThief.getColor(img);
      const bgColor = chroma(dominantColor);
      const textColor = bgColor.luminance() > 0.5 ? 'black' : 'white';
      document.body.style.color = textColor;
    } catch (e) {
      console.warn(e);
    }
  }
});

onMounted(() => {
  // 确保在移动设备上运行
  if (!是否为移动设备()) {
    console.warn('移动端组件在非移动设备上运行');
  }
});
</script>

<style>
.mobile-upload-area {
  width: 100vw;
  height: 100vh;
  background-color: #beb1b1a1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.mobile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: rgba(0, 0, 0, 0.1);
}

.mobile-header h1 {
  margin: 0;
  font-size: 1.2rem;
}

.camera-button {
  padding: 8px 12px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.mobile-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 10px;
}

.upload-prompt {
  opacity: 0.7;
  font-size: 0.9rem;
  text-align: center;
  margin: 10px 0;
}

.map-preview-container {
  display: flex;
  justify-content: center;
  margin: 10px 0;
}

.map-previewer {
  max-width: 100%;
  max-height: 200px;
}

.editor-tabs {
  display: flex;
  justify-content: space-around;
  margin: 10px 0;
  border-bottom: 1px solid #ccc;
}

.tab-button {
  padding: 10px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  color: #666;
  border-bottom: 2px solid transparent;
}

.tab-button.active {
  color: #000;
  border-bottom-color: #4CAF50;
}

.editor-container {
  flex: 1;
  overflow-y: auto;
}

.editor-panel {
  width: 100%;
}

.mobile-footer {
  padding: 10px;
  text-align: center;
  font-size: 0.8rem;
  opacity: 0.7;
}

.texture-previewer {
  width: 100%;
  height: 300px;
}

.mobile-upload-area.drag-over {
  border: 2px solid #000;
}

/* 移动端样式适配 */
@media (max-width: 768px) {
  .mobile-header h1 {
    font-size: 1rem;
  }
  
  .camera-button {
    padding: 6px 10px;
    font-size: 0.9rem;
  }
  
  .tab-button {
    padding: 8px 6px;
    font-size: 0.9rem;
  }
}
</style>
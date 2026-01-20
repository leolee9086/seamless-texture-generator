<template>
  <div
    class="w-screen h-screen bg-gradient-to-br from-gray-900 to-black text-white font-sans relative overflow-hidden flex flex-row"
    @dragenter.prevent="handleDragEnter" @dragleave.prevent="handleDragLeave" @dragover.prevent
    @drop.prevent="handleDrop">

    <!-- Controls Area (Left) -->
    <div class="z-20 m-4 mr-0 w-96 min-w-96 overflow-y-auto scrollbar-hide">
      <DesktopControls :is-processing="isProcessing" :original-image="originalImage" :processed-image="processedImage"
        :max-resolution="maxResolution" :border-size="borderSize" :split-position="splitPosition"
        :magnifier-enabled="magnifierEnabled" :zoom-level="zoomLevel" :lut-enabled="lutEnabled"
        :lut-intensity="lutIntensity" :lut-file-name="lutFileName" :lut-file="lutFile" :global-hsl="globalHSL"
        :hsl-layers="hslLayers" :exposure-strength="exposureStrength" :exposure-manual="exposureManual"
        :dehaze-params="dehazeParams" :clarity-params="clarityParams" :luminance-params="luminanceParams"
        @control-event="handleControlEvent" />
    </div>

    <!-- Viewer Area (Right) -->
    <div class="flex-1 relative z-0 overflow-hidden m-4 rounded-3xl shadow-inner bg-darkglass-200">
      <Viewer ref="viewerRef" :original-image="originalImage" :processed-image="processedImage"
        v-model:split-position="splitPosition" :magnifier-enabled="magnifierEnabled" :is-processing="isProcessing"
        :error-message="errorMessage" :zoom-level="zoomLevel" :preview-overlay="previewOverlay"
        @clear-overlay="clearPreviewOverlay" class="w-full h-full object-contain" />
    </div>

    <!-- Project Sidebar (Far Right) -->
    <ProjectSidebar class="w-64 m-4 ml-0 rounded-3xl overflow-hidden shadow-xl z-20" @export="handleExport" />

    <!-- Sampling Editor -->
    <SamplingEditor :visible="isSampling" :original-image="rawOriginalImage" @close="isSampling = false"
      @confirm="handleSamplingConfirmWrapper" />

    <!-- Export Dialogs -->
    <ExportDialog v-if="showExportDialog" :selected-count="projectState.projects.value.length"
      @cancel="showExportDialog = false" @confirm="handleExportConfirm"
      @configure-watermark="handleOpenWatermarkConfig" />

    <ExportProgress v-if="showExportProgress" @close="showExportProgress = false" />

    <!-- Drag Overlay -->
    <div v-if="isDragging"
      class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm border-4 border-dashed border-white/20 m-4 rounded-3xl transition-all duration-300">
      <div class="i-carbon-upload text-6xl text-white/80 mb-4 animate-bounce"></div>
      <p class="text-2xl font-light text-white/90">Release to Import Image</p>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DesktopControls from './components/desktop/DesktopControls.vue'
import Viewer from './components/Viewer.vue'
import ProjectSidebar from './components/project-manager/ProjectSidebar.vue'
import ExportDialog from './components/export-dialog/ExportDialog.vue'
import ExportProgress from './components/export-dialog/ExportProgress.vue'
import { SamplingEditor } from './components/sampling-editor'
import { useTextureGenerator } from './composables/useTextureGenerator'
import { useGlobalDragDrop } from './composables/useGlobalDragDrop'
import { useBatchExport } from './composables/useBatchExport'
import { useProjectState } from './composables/project-state/index'
import type { ExportPreset } from './types/export.types'

const { state: projectState, actions: projectActions } = useProjectState()
const exporter = useBatchExport()

// Dialog states
const showExportDialog = ref(false)
const showExportProgress = ref(false)

const { state: dragState, actions: dragActions } = useGlobalDragDrop(
  // 单文件回调 (保留作为兜底，但主要逻辑由多文件回调处理)
  async (file) => {
    const project = await projectActions.createProject(file)
    await projectActions.switchProject(project.id)
  },
  ['image/'],
  // 多文件回调
  async (files) => {
    const projects = await projectActions.createProjects(files)
    if (projects.length > 0) {
      // 切换到第一个导入的项目 (或最新的)
      await projectActions.switchProject(projects[0].id)
    }
  }
)

const { isDragging } = dragState
const { handleDragEnter, handleDragLeave, handleDrop } = dragActions

// 使用共享逻辑，启用摄像头功能
const {
  originalImage,
  rawOriginalImage,
  processedImage,
  borderSize,
  maxResolution,
  splitPosition,
  isProcessing,
  isSampling,
  errorMessage,
  viewerRef,
  zoomLevel,
  magnifierEnabled,
  lutEnabled,
  lutIntensity,
  lutFileName,
  lutFile,
  previewOverlay,
  globalHSL,
  hslLayers,
  exposureStrength,
  exposureManual,
  dehazeParams,
  clarityParams,
  luminanceParams,
  clearPreviewOverlay,
  handleSamplingConfirmWrapper,
  handleControlEvent,
} = useTextureGenerator({
  enableCamera: true,
  initialMaxResolution: 4096,
  initialBorderSize: 0,
})

// === State Bridge ===
// 不需要手动 watch activeOriginalDataUrl，因为 rawOriginalImage 已经是 computed 属性，
// 会自动响应 projectState.activeOriginalDataUrl 的变化。
// 原有的 watch 会触发 rawOriginalImage 的 setter，导致错误的创建新项目逻辑。

// === Event Handlers ===
const handleExport = () => {
  if (projectState.projects.value.length === 0) return
  showExportDialog.value = true
}

const handleExportConfirm = async (payload: { preset: ExportPreset, mode: 'individual' | 'zip' }) => {
  showExportDialog.value = false
  showExportProgress.value = true

  const projectIds = projectState.projects.value.map(p => p.id)
  await exporter.startExport(projectIds, payload.preset, payload.mode)
}

const handleOpenWatermarkConfig = () => {
  showExportDialog.value = false
  alert('请在左侧控制面板中配置水印，然后再次点击导出。')
}
</script>

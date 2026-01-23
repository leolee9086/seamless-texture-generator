<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <span :class="headerClass">Procedural Texture</span>
      
      <!-- 保存为项目按钮 -->
      <button
        v-if="state.canSaveAsProject.value"
        @click="handleSaveAsProject"
        :disabled="state.isSaving.value"
        class="px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
        :class="state.saveButtonClass.value"
        title="将当前程序化纹理保存为新项目"
      >
        <span v-if="!state.isSaving.value" class="flex items-center gap-1.5">
          <div class="i-carbon-save text-sm"></div>
          <span>保存为项目</span>
        </span>
        <span v-else class="flex items-center gap-1.5">
          <div class="i-carbon-circle-dash animate-spin text-sm"></div>
          <span>保存中...</span>
        </span>
      </button>
    </div>

    <!-- Texture Type Selector -->
    <horizontalScrollButtons
      :active-type="proceduralType"
      :texture-types="textureTypes"
      @type-change="$emit('type-change', $event)"
    />

    <!-- Procedural Panel Renderer -->
    <ProceduralPanelRenderer
      :procedural-type="proceduralType"
      :is-generating="isGenerating"
      @set-image="handleSetImage"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, useCanvasModeManager } from './imports'
import { horizontalScrollButtons } from './imports'
import { 处理程序化纹理图像更新 } from './ProceduralTabContent.utils'
import { createProceduralTabContentState, createSaveAsProjectFn } from './ProceduralTabContent.ctx'
import ProceduralPanelRenderer from './ProceduralPanelRenderer.vue'

const props = defineProps<{
  isMobile?: boolean
  proceduralType: string
  textureTypes: readonly string[]
  isGenerating: boolean
}>()

defineEmits<{
  'type-change': [type: string]
}>()

const canvasModeManager = useCanvasModeManager()
const state = createProceduralTabContentState()
const handleSaveAsProject = createSaveAsProjectFn(state)

const headerClass = computed(() =>
  props.isMobile
    ? 'text-xs font-bold text-gray-400 uppercase tracking-wider'
    : 'text-sm font-medium text-gray-400 uppercase tracking-wider'
)

/** @简洁函数 处理程序化纹理图像更新，委托给工具函数 */
const handleSetImage = (imageData: string): void => {
  处理程序化纹理图像更新(imageData, canvasModeManager)
}
</script>
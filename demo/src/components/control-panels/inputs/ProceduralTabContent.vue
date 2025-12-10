<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <span :class="headerClass">Procedural Texture</span>
    </div>

    <!-- Texture Type Selector -->
    <TextureTypeSelector 
      :active-type="proceduralType" 
      :texture-types="textureTypes"
      @type-change="$emit('type-change', $event)" 
    />

    <!-- Procedural Panel Renderer -->
    <ProceduralPanelRenderer 
      :procedural-type="proceduralType" 
      :is-generating="isGenerating"
      @set-image="$emit('set-image', $event)" 
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import TextureTypeSelector from './TextureTypeSelector.vue'
import ProceduralPanelRenderer from './ProceduralPanelRenderer.vue'

const props = defineProps<{
  isMobile?: boolean
  proceduralType: string
  textureTypes: readonly string[]
  isGenerating: boolean
}>()

defineEmits<{
  'type-change': [type: string]
  'set-image': [imageData: string]
}>()

const headerClass = computed(() =>
  props.isMobile
    ? 'text-xs font-bold text-gray-400 uppercase tracking-wider'
    : 'text-sm font-medium text-gray-400 uppercase tracking-wider'
)
</script>
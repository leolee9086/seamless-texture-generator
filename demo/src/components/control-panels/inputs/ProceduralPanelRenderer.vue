<template>
  <div class="flex flex-col gap-4">
    <!-- Wood Panel -->
    <WoodPanel v-if="proceduralType === 'Wood'" :is-generating="isGenerating"
      @set-image="$emit('set-image', $event)" />

    <!-- Plain Weave Panel -->
    <PlainWeavePanel v-if="proceduralType === 'Plain Weave'" :is-generating="isGenerating"
      @set-image="$emit('set-image', $event)" />

    <!-- Leather Panel -->
    <LeatherPanel v-if="proceduralType === 'Leather'" :is-generating="isGenerating"
      @set-image="$emit('set-image', $event)" />

    <!-- Twill Weave Panel -->
    <TwillWeavePanel v-if="proceduralType === 'Twill Weave'" :is-generating="isGenerating"
      @set-image="$emit('set-image', $event)" />

    <!-- Velvet Panel -->
    <VelvetPanel v-if="proceduralType === 'Velvet'" :is-generating="isGenerating"
      @set-image="$emit('set-image', $event)" />

    <!-- Turing Panel -->
    <TuringPanel v-if="proceduralType === 'Turing'" :is-generating="isGenerating"
      @set-image="$emit('set-image', $event)" />

    <!-- Gray-Scott Turing Panel -->
    <GrayScottTuringPanel v-if="proceduralType === 'Gray-Scott'" :is-generating="isGenerating"
      @set-image="$emit('set-image', $event)" />

    <!-- Grayscale Compositor Panel -->
    <GrayscaleCompositorPanel v-if="proceduralType === 'Compositor'" :is-generating="isGenerating"
      @set-image="$emit('set-image', $event)" />
  </div>
</template>

<script setup lang="ts">
import {
  WoodPanel,
  PlainWeavePanel,
  LeatherPanel,
  TwillWeavePanel,
  VelvetPanel,
  TuringPanel,
  GrayScottTuringPanel,
  GrayscaleCompositorPanel
} from './imports'

defineProps<{
  proceduralType: string
  isGenerating: boolean
}>()

defineEmits<{
  'set-image': [imageData: string]
}>()
</script>
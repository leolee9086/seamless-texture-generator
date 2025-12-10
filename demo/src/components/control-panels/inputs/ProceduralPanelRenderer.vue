<template>
  <div class="flex flex-col gap-4">
    <!-- Wood Panel -->
    <WoodPanel v-if="proceduralType === 'Wood'" :is-generating="isGenerating"
      @set-image="$emit('set-image', $event)" />

    <!-- Plain Weave Panel -->
    <component :is="wrappedPlainWeavePanel" v-if="proceduralType === 'Plain Weave'" />

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
import { computed } from 'vue'
import {
  WoodPanel,
  PlainWeavePanel,
  LeatherPanel,
  TwillWeavePanel,
  VelvetPanel,
  TuringPanel,
  GrayScottTuringPanel,
  GrayscaleCompositorPanel,
  createZeroBindingPlainWeavePanel,
  isValidImageDataArg
} from './imports'

const props = defineProps<{
  proceduralType: string
  isGenerating: boolean
}>()

const emit = defineEmits<{
  'set-image': [imageData: string]
}>()

// 创建零绑定包装后的 PlainWeavePanel 组件
const wrappedPlainWeavePanel = computed(() => {
  return createZeroBindingPlainWeavePanel({
    props: {
      isGenerating: props.isGenerating
    },
    emits: {
      'set-image': (...args: unknown[]) => {
        if (isValidImageDataArg(args)) {
          emit('set-image', args[0])
        }
      }
    }
  })
})
</script>
<template>
  <button @click="handleClick" :disabled="isGenerating"
      class="glass-btn w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-white/60 hover:text-white/90 text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50">
      <div v-if="isGenerating" class="i-carbon-circle-dash animate-spin text-lg"></div>
      <div v-else class="i-carbon-magic-wand text-lg"></div>
      {{ isGenerating ? generatingText : buttonText }}
  </button>
</template>

<script setup lang="ts">
import type { GenerateButtonProps } from './GenerateButton.types'

const props = withDefaults(defineProps<GenerateButtonProps>(), {
  buttonText: 'Generate',
  generatingText: 'Generating...'
})

const emit = defineEmits<{
  click: []
}>()

const handleClick = () => {
  emit('click')
}
</script>
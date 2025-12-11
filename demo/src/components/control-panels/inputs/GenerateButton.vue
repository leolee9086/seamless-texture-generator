<template>
  <button
    @click="$emit('generate')"
    :disabled="disabled"
    class="glass-btn py-2.5 text-sm font-medium rounded-lg transition-all duration-300"
    :class="buttonClass"
  >
    {{ isGenerating ? '生成中...' : '生成图像' }}
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  isGenerating: boolean
  disabled: boolean
  apiKeyValid: boolean
  promptValid: boolean
}>()

const buttonClass = computed(() => {
  if (props.apiKeyValid && props.promptValid && !props.isGenerating) {
    return 'bg-blue-600/80 text-white hover:bg-blue-500/80'
  }
  return 'bg-gray-700/50 text-white/40 cursor-not-allowed'
})
</script>
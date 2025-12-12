<template>
  <div class="flex flex-col gap-2">
    <button @click="$emit('toggle')"
      class="glass-btn flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg text-white/80 hover:text-white transition-all">
      <span>高级参数</span>
      <div class="i-carbon-chevron-down text-sm transition-transform duration-200"
        :class="showAdvanced ? 'rotate-180' : ''"></div>
    </button>
    <AdvancedParametersContent v-if="showAdvanced" :num-inference-steps="numInferenceSteps" :model="model"
      :proxy-url="proxyUrl" @update:num-inference-steps="$emit('update:numInferenceSteps', $event)"
      @update:model="$emit('update:model', $event)" @update:proxy-url="$emit('update:proxyUrl', $event)" />
  </div>
</template>

<script setup lang="ts">
import AdvancedParametersContent from './AdvancedParametersContent.vue'

defineProps<{
  showAdvanced: boolean
  numInferenceSteps: number
  model: string
  proxyUrl: string
}>()

defineEmits<{
  toggle: []
  'update:numInferenceSteps': [value: number]
  'update:model': [value: string]
  'update:proxyUrl': [value: string]
}>()
</script>
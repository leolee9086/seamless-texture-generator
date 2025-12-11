<template>
  <div class="flex flex-col gap-2">
    <button
      @click="$emit('toggle')"
      class="flex items-center justify-between text-xs font-medium text-white/60 hover:text-white/80"
    >
      <span>高级参数</span>
      <span>{{ showAdvanced ? '▲' : '▼' }}</span>
    </button>
    <AdvancedParametersContent
      v-if="showAdvanced"
      :num-inference-steps="numInferenceSteps"
      :model="model"
      :proxy-url="proxyUrl"
      @update:num-inference-steps="$emit('update:numInferenceSteps', $event)"
      @update:model="$emit('update:model', $event)"
      @update:proxy-url="$emit('update:proxyUrl', $event)"
    />
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
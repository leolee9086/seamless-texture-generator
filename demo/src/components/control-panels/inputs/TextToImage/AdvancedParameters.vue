<template>
  <div class="flex flex-col gap-2">
    <button @click="$emit('toggle')"
      class="glass-btn flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg text-white/80 hover:text-white transition-all">
      <span>高级参数</span>
      <div class="i-carbon-chevron-down text-sm transition-transform duration-200"
        :class="showAdvanced ? 'rotate-180' : ''"></div>
    </button>
    <AdvancedParametersContent v-if="showAdvanced" :num-inference-steps="numInferenceSteps" :model="model"
      :proxy-url="proxyUrl" :proxy-type="proxyType" :siyuan-url="siyuanUrl" :siyuan-token="siyuanToken"
      @update:num-inference-steps="$emit('update:numInferenceSteps', $event)"
      @update:model="$emit('update:model', $event)" @update:proxy-url="$emit('update:proxyUrl', $event)"
      @update:proxy-type="$emit('update:proxyType', $event)" @update:siyuan-url="$emit('update:siyuanUrl', $event)"
      @update:siyuan-token="$emit('update:siyuanToken', $event)" />
  </div>
</template>

<script setup lang="ts">
import AdvancedParametersContent from './AdvancedParametersContent.vue'
import type { ProxyType } from './TextToImageTabContent.types'

defineProps<{
  showAdvanced: boolean
  numInferenceSteps: number
  model: string
  proxyUrl: string
  proxyType: ProxyType
  siyuanUrl: string
  siyuanToken: string
}>()

defineEmits<{
  toggle: []
  'update:numInferenceSteps': [value: number]
  'update:model': [value: string]
  'update:proxyUrl': [value: string]
  'update:proxyType': [value: ProxyType]
  'update:siyuanUrl': [value: string]
  'update:siyuanToken': [value: string]
}>()
</script>
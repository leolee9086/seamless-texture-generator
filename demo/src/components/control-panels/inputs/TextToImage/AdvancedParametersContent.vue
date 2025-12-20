<template>
  <div class="flex flex-col gap-3 p-3 bg-white/5 rounded-lg">
    <!-- Inference Steps -->
    <div class="flex flex-col gap-1">
      <label class="text-xs font-medium text-white/70">推理步数 (num_inference_steps)</label>
      <input
        :value="numInferenceSteps"
        type="range"
        min="4"
        max="20"
        step="1"
        class="w-full"
        @input="$emit('update:numInferenceSteps', Number(($event.target as HTMLInputElement).value))"
      />
      <div class="flex justify-between text-xs text-white/50">
        <span>极速 (4)</span>
        <span>标准 (9)</span>
        <span>精细 (20)</span>
      </div>
      <div class="text-center text-xs text-white/70">{{ numInferenceSteps }} 步</div>
    </div>
    <!-- Model Selection -->
    <div class="flex flex-col gap-1">
      <label class="text-xs font-medium text-white/70">模型</label>
      <select
        :value="model"
        class="glass-input px-2 py-1.5 text-sm rounded-lg"
        @change="$emit('update:model', ($event.target as HTMLSelectElement).value)"
      >
        <option value="Tongyi-MAI/Z-Image-Turbo">Z-Image-Turbo (推荐)</option>
        <option value="Tongyi-MAI/Z-Image">Z-Image</option>
        <option value="Qwen/Qwen-Image">Qwen-Image</option>
      </select>
    </div>
    <!-- Proxy Settings -->
    <div class="flex flex-col gap-2 border-t border-white/10 pt-2">
      <label class="text-xs font-medium text-white/70">代理方式</label>
      <div class="flex gap-2">
        <label class="flex items-center gap-1 text-xs text-white/80 cursor-pointer">
          <input type="radio" :checked="proxyType === 'default'" @change="$emit('update:proxyType', 'default')" />
          默认
        </label>
        <label class="flex items-center gap-1 text-xs text-white/80 cursor-pointer">
          <input type="radio" :checked="proxyType === 'custom'" @change="$emit('update:proxyType', 'custom')" />
          自定义
        </label>
        <label class="flex items-center gap-1 text-xs text-white/80 cursor-pointer">
          <input type="radio" :checked="proxyType === 'siyuan'" @change="$emit('update:proxyType', 'siyuan')" />
          思源代理
        </label>
      </div>
    </div>

    <!-- Custom Proxy URL Input -->
    <div v-if="proxyType === 'custom'" class="flex flex-col gap-1">
      <label class="text-xs font-medium text-white/70">自定义代理 URL</label>
      <input
        :value="proxyUrl"
        type="text"
        placeholder="/api/common-proxy"
        class="glass-input px-2 py-1.5 text-sm rounded-lg"
        @input="$emit('update:proxyUrl', ($event.target as HTMLInputElement).value)"
      />
      <p class="text-xs text-white/40">代理需支持 ?target=url 转发形式</p>
    </div>

    <!-- SiYuan Settings -->
    <div v-if="proxyType === 'siyuan'" class="flex flex-col gap-2">
      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium text-white/70">SiYuan 地址</label>
        <input
          :value="siyuanUrl"
          type="text"
          placeholder="http://127.0.0.1:6806"
          class="glass-input px-2 py-1.5 text-sm rounded-lg"
          @input="$emit('update:siyuanUrl', ($event.target as HTMLInputElement).value)"
        />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium text-white/70">API Token</label>
        <input
          :value="siyuanToken"
          type="password"
          placeholder="SiYuan API Token"
          class="glass-input px-2 py-1.5 text-sm rounded-lg"
          @input="$emit('update:siyuanToken', ($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ProxyType } from './TextToImageTabContent.types'

defineProps<{
  numInferenceSteps: number
  model: string
  proxyUrl: string
  proxyType: ProxyType
  siyuanUrl: string
  siyuanToken: string
}>()

defineEmits<{
  'update:numInferenceSteps': [value: number]
  'update:model': [value: string]
  'update:proxyUrl': [value: string]
  'update:proxyType': [value: ProxyType]
  'update:siyuanUrl': [value: string]
  'update:siyuanToken': [value: string]
}>()
</script>
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
    <!-- Proxy URL -->
    <div class="flex flex-col gap-1">
      <label class="text-xs font-medium text-white/70">代理 URL (可选)</label>
      <input
        :value="proxyUrl"
        type="text"
        placeholder="https://api-inference.modelscope.cn"
        class="glass-input px-2 py-1.5 text-sm rounded-lg"
        @input="$emit('update:proxyUrl', ($event.target as HTMLInputElement).value)"
      />
      <p class="text-xs text-white/50">留空则使用默认代理</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  numInferenceSteps: number
  model: string
  proxyUrl: string
}>()

defineEmits<{
  'update:numInferenceSteps': [value: number]
  'update:model': [value: string]
  'update:proxyUrl': [value: string]
}>()
</script>
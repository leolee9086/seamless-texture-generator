<template>
  <div class="flex flex-col gap-2">
    <label class="text-xs font-medium text-white/70">ModelScope API Key</label>
    <input
      :value="modelValue"
      type="password"
      placeholder="输入您的 API Key (以 'ms-' 开头)"
      class="glass-input px-3 py-2 text-sm rounded-lg"
      :class="isMobile ? 'h-10' : 'h-9'"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <p class="text-xs text-white/40">
      您的 API Key 仅存储在本地浏览器中，不会上传到任何服务器。
      <a
        href="https://modelscope.cn/settings/token"
        target="_blank"
        class="text-blue-400 hover:text-blue-300 underline"
      >获取 API Key</a>
    </p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string
  isMobile?: boolean
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>
<template>
  <div class="flex gap-2">
    <button
        @click="$emit('mode-change', 'file')"
        :class="[
          'px-3 py-1 text-xs rounded transition-colors',
          modelValue === 'file'
            ? 'bg-blue-600/30 text-blue-300 border border-blue-500/30'
            : 'bg-white/10 text-white/60 border border-white/20 hover:bg-white/20'
        ]"
      >
      📁 文件模式
    </button>
    <button
        @click="$emit('mode-change', 'temp')"
        :class="[
          'px-3 py-1 text-xs rounded transition-colors',
          modelValue === 'temp'
            ? 'bg-blue-600/30 text-blue-300 border border-blue-500/30'
            : 'bg-white/10 text-white/60 border border-white/20 hover:bg-white/20'
        ]"
      >
      ⌨️ 临时输入
    </button>
  </div>
</template>

<script setup lang="ts">
import type { InputMode } from './SecureApiKeyInput.types'

defineProps<{
  modelValue: InputMode
}>()

defineEmits<{
  'mode-change': [mode: InputMode]
}>()
</script>
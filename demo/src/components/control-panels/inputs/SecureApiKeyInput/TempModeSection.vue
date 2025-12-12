<template>
  <div v-if="inputMode === 'temp'" class="flex flex-col gap-2">
    <input
            :value="tempApiKey"
            @input="handleTempKeyInput"
            type="password"
            placeholder="输入您的 API Key (以 'ms-' 开头)"
            class="glass-input px-3 py-2 text-sm rounded-lg"
            :class="isMobile ? 'h-10' : 'h-9'"
          />
    <p class="text-xs text-white/40">
            临时输入的 API Key 仅在当前会话中使用，不会持久化存储。
            <a
              href="https://modelscope.cn/settings/token"
              target="_blank"
              class="text-blue-400 hover:text-blue-300 underline"
            >获取 API Key</a>
          </p>
  </div>
</template>

<script setup lang="ts">
import { isHTMLInputElement } from './SecureApiKeyInput.guard'

defineProps<{
  inputMode: 'file' | 'temp'
  tempApiKey: string
  isMobile?: boolean
}>()

const emit = defineEmits<{
  'update:tempApiKey': [value: string]
}>()

const handleTempKeyInput = (event: Event) => {
  if (isHTMLInputElement(event.target)) {
    emit('update:tempApiKey', event.target.value)
  }
}
</script>
<template>
  <div class="flex flex-col gap-2">
    <label class="text-xs font-medium text-white/70">ModelScope API Key</label>

    <!-- API 不支持提示 -->
    <div v-if="!secureKeyManager.isSupported" class="glass-input px-3 py-2 text-sm rounded-lg text-red-400">
      ⚠️ 当前浏览器不支持 File System Access API，请使用 Chrome 86+ 或 Edge 86+
    </div>

    <div v-else class="flex flex-col gap-2">
      <!-- 输入模式切换 -->
      <div class="flex gap-2">
        <button @click="setInputMode('file')" :class="[
          'px-3 py-1 text-xs rounded transition-colors',
          inputMode === 'file'
            ? 'bg-blue-600/30 text-blue-300 border border-blue-500/30'
            : 'bg-white/10 text-white/60 border border-white/20 hover:bg-white/20'
        ]">
          📁 文件模式
        </button>
        <button @click="setInputMode('temp')" :class="[
          'px-3 py-1 text-xs rounded transition-colors',
          inputMode === 'temp'
            ? 'bg-blue-600/30 text-blue-300 border border-blue-500/30'
            : 'bg-white/10 text-white/60 border border-white/20 hover:bg-white/20'
        ]">
          ⌨️ 临时输入
        </button>
      </div>

      <!-- 文件模式内容 -->
      <FileModeContent :input-mode="inputMode" :has-key-file="hasKeyFile" :file-name="fileName"
        :temp-api-key="tempApiKey" :is-mobile="isMobile" @select-key-file="selectKeyFile" @clear-key-file="clearKeyFile"
        @update:temp-api-key="handleTempApiKeyUpdate" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { secureKeyManager } from './SecureKeyManager.class'
import { useSecureApiKeyInput } from './SecureApiKeyInput.logic'
import FileModeContent from './FileModeContent.vue'

const props = defineProps<{
  modelValue?: string
  isMobile?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'key-ready': [hasKey: boolean]
  'key-cleared': []
}>()

// 使用外部逻辑 (watch 和双向绑定已在 logic 内部处理)
const { state, actions } = useSecureApiKeyInput(props, emit)
const { inputMode, fileName, tempApiKey, hasKeyFile } = state
const { selectKeyFile, clearKeyFile, setInputMode, handleTempApiKeyUpdate } = actions
</script>
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
import { ref, computed, onMounted, watch } from './imports'
import { secureKeyManager } from './SecureKeyManager.class'
import { useSecureApiKeyInput } from './SecureApiKeyInput.logic'
import { EVENT_NAMES } from './SecureApiKeyInput.constants'
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

// 使用外部逻辑
const { state, actions } = useSecureApiKeyInput(props, emit)
const {
  inputMode,
  fileName,
  tempApiKey,
  hasKeyFile,
  hasTempKey,
  hasAnyKey
} = state
const {
  selectKeyFile,
  clearKeyFile,
  setInputMode,
  handleTempKeyChange
} = actions

// 处理临时API Key更新
const handleTempApiKeyUpdate = (value: string) => {
  tempApiKey.value = value
  handleTempKeyChange()
}

// 监听 tempApiKey 变化，同步到 modelValue
watch(tempApiKey, (newValue: string) => {
  emit(EVENT_NAMES.UPDATE_MODEL_VALUE, newValue)
})

// 监听 modelValue 变化，同步到 tempApiKey
watch(() => props.modelValue, (newValue: string | undefined) => {
  if (newValue !== undefined && newValue !== tempApiKey.value) {
    tempApiKey.value = newValue
  }
}, { immediate: true })
</script>
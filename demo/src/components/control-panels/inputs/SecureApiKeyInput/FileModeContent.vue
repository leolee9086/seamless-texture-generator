<template>
  <!-- 文件模式 -->
  <FileModeSection
    :input-mode="inputMode"
    :has-key-file="hasKeyFile"
    :file-name="fileName"
    :is-mobile="isMobile"
    @select-key-file="$emit('selectKeyFile')"
    @clear-key-file="$emit('clearKeyFile')"
  />
  
  <!-- 临时输入模式 -->
  <TempModeSection
    :input-mode="inputMode"
    :temp-api-key="tempApiKey"
    :is-mobile="isMobile"
    @update:temp-api-key="$emit('update:tempApiKey', $event)"
  />
</template>

<script setup lang="ts">
import FileModeSection from './FileModeSection.vue'
import TempModeSection from './TempModeSection.vue'

defineProps<{
  inputMode: 'file' | 'temp'
  hasKeyFile: boolean
  fileName: string
  tempApiKey: string
  isMobile?: boolean
}>()

defineEmits<{
  selectKeyFile: []
  clearKeyFile: []
  'update:tempApiKey': [value: string]
}>()
</script>
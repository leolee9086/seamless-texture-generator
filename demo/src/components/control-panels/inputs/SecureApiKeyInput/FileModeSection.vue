<template>
  <div v-if="inputMode === 'file'" class="flex flex-col gap-2">
    <div v-if="!hasKeyFile" class="flex flex-col gap-2">
      <button
            @click="$emit('selectKeyFile')"
            class="glass-input px-3 py-2 text-sm rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition-colors"
            :class="isMobile ? 'h-10' : 'h-9'"
          >
            📁 选择密钥文件
          </button>
      <p class="text-xs text-white/40">
            选择包含您的 API Key 的本地文件。密钥仅在内存中临时使用，不会持久化存储。
            <a
              href="https://modelscope.cn/settings/token"
              target="_blank"
              class="text-blue-400 hover:text-blue-300 underline"
            >获取 API Key</a>
          </p>
    </div>
    
    <div v-else class="flex flex-col gap-2">
      <div class="glass-input px-3 py-2 text-sm rounded-lg bg-green-600/20 border border-green-500/30">
            🔒 已选择密钥文件: {{ fileName || '密钥文件' }}
          </div>
      <div class="flex gap-2">
            <button
                @click="$emit('selectKeyFile')"
                class="glass-input px-3 py-2 text-sm rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition-colors"
                :class="isMobile ? 'h-10' : 'h-9'"
              >
                🔄 重新选择
              </button>
            <button
                @click="$emit('clearKeyFile')"
                class="glass-input px-3 py-2 text-sm rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 transition-colors"
                :class="isMobile ? 'h-10' : 'h-9'"
              >
                🗑️ 清除
              </button>
            </div>
      <p class="text-xs text-green-400">
            ✅ 密钥文件已安全加载，将在使用时临时读取
          </p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  inputMode: 'file' | 'temp'
  hasKeyFile: boolean
  fileName: string
  isMobile?: boolean
}>()

defineEmits<{
  selectKeyFile: []
  clearKeyFile: []
}>()
</script>
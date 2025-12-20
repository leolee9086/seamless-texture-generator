<template>
  <div class="flex flex-col gap-4">
    <!-- API Key Input -->
    <ApiKeyInput v-model="apiKey" :is-mobile="isMobile" />

    <!-- Prompt Input -->
    <PromptInput v-model="prompt" />

    <!-- Parameters -->
    <ParameterGrid v-model:size="size" v-model:n="n" v-model:batch-interval="batchInterval" />

    <!-- Advanced Parameters (Collapsible) -->
    <!-- Advanced Parameters (Collapsible) -->
    <AdvancedParameters v-model:num-inference-steps="numInferenceSteps" v-model:model="model"
      v-model:proxy-url="proxyUrl" v-model:proxy-type="proxyType" v-model:siyuan-url="siyuanUrl"
      v-model:siyuan-token="siyuanToken" :show-advanced="showAdvanced" @toggle="showAdvanced = !showAdvanced" />

    <!-- Generate Button -->
    <GenerateButton :is-generating="isGenerating" :disabled="isGenerating || !apiKeyValid || !prompt.trim()"
      :api-key-valid="apiKeyValid" :prompt-valid="!!prompt.trim()" @generate="generate" />

    <!-- Status & Error -->
    <StatusDisplay :error="error" :status="status" />

    <!-- Generated Images Gallery -->
    <ImageGallery :image-urls="proxiedUrls" :on-image-click="handleImageClick" />

    <!-- Proxy Warning Modal -->
    <ProxyWarningModal :show="showProxyWarning" @continue="handleProxyWarningResponse(true)"
      @cancel="handleProxyWarningResponse(false)" />
  </div>
</template>

<script setup lang="ts">
import { useTextToImage } from './TextToImageTabContent.ctx'
import { createProxiedUrlsComputed } from './TextToImageTabContent.utils'
import { ApiKeyInput, PromptInput, ParameterGrid, StatusDisplay } from './imports'
import AdvancedParameters from './AdvancedParameters.vue'
import GenerateButton from './GenerateButton.vue'
import ImageGallery from './ImageGallery.vue'
import ProxyWarningModal from './ProxyWarningModal.vue'

defineProps<{
  isMobile?: boolean
}>()

const emit = defineEmits<{
  'set-image': [imageData: string]
}>()

const {
  apiKey,
  prompt,
  size,
  n,
  batchInterval,
  numInferenceSteps,
  model,
  proxyUrl,
  proxyType,
  siyuanUrl,
  siyuanToken,
  showAdvanced,
  isGenerating,
  error,
  status,
  apiKeyValid,
  generate,
  generatedImages,
  showProxyWarning,
  handleProxyWarningResponse
} = useTextToImage((base64: string) => {
  emit('set-image', base64)
})

// 使用工具函数创建代理URL计算属性
// 传入 proxyType 以便区分思源代理和普通代理的缓存 key 策略
const proxiedUrls = createProxiedUrlsComputed(generatedImages, proxyUrl, proxyType)

/**
 * 处理图像点击事件
 * ImageGallery传递的是缓存的base64数据
 */
const handleImageClick = (imageBase64: string): void => {
  emit('set-image', imageBase64)
}
</script>
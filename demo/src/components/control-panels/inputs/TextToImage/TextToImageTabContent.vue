<template>
  <div class="flex flex-col gap-4">
    <!-- API Key Input -->
    <ApiKeyInput v-model="apiKey" :is-mobile="isMobile" />

    <!-- Prompt Input -->
    <PromptInput v-model="prompt" />

    <!-- Parameters -->
    <ParameterGrid v-model:size="size" v-model:n="n" />

    <!-- Advanced Parameters (Collapsible) -->
    <AdvancedParameters v-model:num-inference-steps="numInferenceSteps" v-model:model="model"
      v-model:proxy-url="proxyUrl" :show-advanced="showAdvanced" @toggle="showAdvanced = !showAdvanced" />

    <!-- Generate Button -->
    <GenerateButton :is-generating="isGenerating" :disabled="isGenerating || !apiKeyValid || !prompt.trim()"
      :api-key-valid="apiKeyValid" :prompt-valid="!!prompt.trim()" @generate="generate" />

    <!-- Status & Error -->
    <StatusDisplay :error="error" :status="status" />

    <!-- Generated Images Gallery -->
    <ImageGallery :image-urls="proxiedUrls" :on-image-click="handleImageClick" />
  </div>
</template>

<script setup lang="ts">
import { useTextToImage } from './TextToImageTabContent.ctx'
import { createProxiedUrlsComputed, handleImageClick as handleImageClickUtil } from './TextToImageTabContent.utils'
import { ApiKeyInput, PromptInput, ParameterGrid, StatusDisplay } from './imports'
import AdvancedParameters from './AdvancedParameters.vue'
import GenerateButton from './GenerateButton.vue'
import ImageGallery from './ImageGallery.vue'

const props = defineProps<{
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
  numInferenceSteps,
  model,
  proxyUrl,
  showAdvanced,
  isGenerating,
  error,
  status,
  apiKeyValid,
  generate,
  generatedImages
} = useTextToImage((base64: string) => {
  emit('set-image', base64)
})

// 使用工具函数创建代理URL计算属性
const proxiedUrls = createProxiedUrlsComputed(generatedImages, proxyUrl)

/**
 * 处理图像点击事件
 */
const handleImageClick = async (imageUrl: string): Promise<void> => {
  await handleImageClickUtil(imageUrl, proxyUrl, (base64: string) => {
    emit('set-image', base64)
  })
}
</script>
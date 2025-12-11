<template>
  <div class="flex flex-col gap-4">
    <!-- API Key Input -->
    <ApiKeyInput
      v-model="apiKey"
      :is-mobile="isMobile"
    />

    <!-- Prompt Input -->
    <PromptInput v-model="prompt" />

    <!-- Parameters -->
    <ParameterGrid
      v-model:size="size"
      v-model:n="n"
    />

    <!-- Advanced Parameters (Collapsible) -->
    <AdvancedParameters
      v-model:num-inference-steps="numInferenceSteps"
      v-model:model="model"
      v-model:proxy-url="proxyUrl"
      :show-advanced="showAdvanced"
      @toggle="showAdvanced = !showAdvanced"
    />

    <!-- Generate Button -->
    <GenerateButton
      :is-generating="isGenerating"
      :disabled="isGenerating || !apiKeyValid || !prompt.trim()"
      :api-key-valid="apiKeyValid"
      :prompt-valid="!!prompt.trim()"
      @generate="generate"
    />

    <!-- Status & Error -->
    <StatusDisplay
      :error="error"
      :status="status"
    />

    <!-- Generated Images Gallery -->
    <ImageGallery
      :image-urls="generatedImages"
      :on-image-click="handleImageClick"
    />
  </div>
</template>

<script setup lang="ts">
import { useTextToImage } from './TextToImageTabContent.ctx'
import ApiKeyInput from './ApiKeyInput.vue'
import PromptInput from './PromptInput.vue'
import ParameterGrid from './ParameterGrid.vue'
import AdvancedParameters from './AdvancedParameters.vue'
import GenerateButton from './GenerateButton.vue'
import StatusDisplay from './StatusDisplay.vue'
import ImageGallery from './ImageGallery.vue'
import { fetchImageAsBase64 } from './imports'

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
} = useTextToImage((base64) => {
  emit('set-image', base64)
})

/**
 * 处理图像点击事件
 */
const handleImageClick = async (imageUrl: string): Promise<void> => {
  try {
    const base64 = await fetchImageAsBase64(imageUrl)
    emit('set-image', base64)
  } catch (error) {
    console.error('Failed to load image:', error)
  }
}
</script>
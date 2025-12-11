/**
 * 文本生成图像状态管理
 */

import { ref, computed } from './imports'
import type { UseTextToImageStateReturn } from './TextToImageTabContent.types'

/**
 * 创建文本生成图像的状态和上下文
 */
export function useTextToImageState(): UseTextToImageStateReturn {
  const apiKey = ref('')
  const prompt = ref('')
  const size = ref('1024x1024')
  const n = ref(1)
  const numInferenceSteps = ref(9)
  const model = ref('Tongyi-MAI/Z-Image-Turbo')
  const proxyUrl = ref('')
  const showAdvanced = ref(false)
  const isGenerating = ref(false)
  const error = ref('')
  const status = ref('')
  const generatedImages = ref<string[]>([])

  const apiKeyValid = computed(() => apiKey.value.startsWith('ms-'))

  return {
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
    generatedImages,
    apiKeyValid
  }
}
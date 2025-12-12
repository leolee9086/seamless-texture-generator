/**
 * 文本生成图像状态管理
 */

import { ref, computed, hasValidApiKey } from './imports'
import { DEFAULTS } from './TextToImageTabContent.constants'
import type { UseTextToImageStateReturn } from './TextToImageTabContent.types'

/**
 * 创建文本生成图像的状态和上下文
 */
export function useTextToImageState(): UseTextToImageStateReturn {
  const apiKey = ref('')
  const prompt = ref('')
  const size = ref(DEFAULTS.SIZE)
  const n = ref(DEFAULTS.N)
  const numInferenceSteps = ref(DEFAULTS.NUM_INFERENCE_STEPS)
  const model = ref(DEFAULTS.MODEL)
  const proxyUrl = ref(DEFAULTS.PROXY_URL)
  const showAdvanced = ref(DEFAULTS.SHOW_ADVANCED)
  const isGenerating = ref(false)
  const error = ref('')
  const status = ref('')
  const generatedImages = ref<string[]>([])
  
  // 检查 API Key 是否有效（支持临时输入和文件模式）
  const apiKeyValid = computed(() => hasValidApiKey(apiKey.value))
  
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
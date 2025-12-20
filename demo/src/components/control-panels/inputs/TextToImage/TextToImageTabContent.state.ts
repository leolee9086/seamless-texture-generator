/**
 * 文本生成图像状态管理
 */

import { ref, computed, hasValidApiKey } from './imports'
import { DEFAULTS } from './TextToImageTabContent.constants'
import type { UseTextToImageStateReturn, ProxyType } from './TextToImageTabContent.types'

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
  const batchInterval = ref(0)
  const proxyType = ref<ProxyType>(DEFAULTS.PROXY_TYPE)
  const siyuanUrl = ref(DEFAULTS.SIYUAN_URL)
  const siyuanToken = ref(DEFAULTS.SIYUAN_TOKEN)
  const showAdvanced = ref(DEFAULTS.SHOW_ADVANCED)
  const isGenerating = ref(false)
  const error = ref('')
  const status = ref('')
  const generatedImages = ref<string[]>([])

  // 代理警告弹窗状态
  const showProxyWarning = ref(false)
  // 用于等待用户对代理警告的响应
  let proxyWarningResolve: ((continueGeneration: boolean) => void) | null = null

  // 检查 API Key 是否有效（支持临时输入和文件模式）
  const apiKeyValid = computed(() => hasValidApiKey(apiKey.value))

  /**
   * 显示代理警告并等待用户响应
   */
  function showProxyWarningAndWait(): Promise<boolean> {
    return new Promise((resolve) => {
      proxyWarningResolve = resolve
      showProxyWarning.value = true
    })
  }

  /**
   * 处理用户对代理警告的响应
   */
  function handleProxyWarningResponse(continueGeneration: boolean): void {
    showProxyWarning.value = false
    if (proxyWarningResolve) {
      proxyWarningResolve(continueGeneration)
      proxyWarningResolve = null
    }
  }

  return {
    apiKey,
    prompt,
    size,
    n,
    numInferenceSteps,
    model,
    proxyUrl,
    batchInterval,
    proxyType,
    siyuanUrl,
    siyuanToken,
    showAdvanced,
    isGenerating,
    error,
    status,
    generatedImages,
    apiKeyValid,
    showProxyWarning,
    showProxyWarningAndWait,
    handleProxyWarningResponse
  }
}
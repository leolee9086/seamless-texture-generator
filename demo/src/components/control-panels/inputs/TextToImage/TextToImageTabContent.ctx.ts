/**
 * 文本生成图像上下文（组合式函数）
 */

import { useTextToImageState } from './TextToImageTabContent.state'
import { generateTextToImage } from './TextToImageTabContent.utils'
import { fetchImageWithProxy, buildProxyUrl } from './imports'
import {
  VALIDATION_ERRORS,
  STATUS_MESSAGES,
  ERROR_MESSAGES,
  DEFAULTS,
} from './TextToImageTabContent.constants'
import { PROXY_CHECK } from './ProxyWarningModal.constants'
import { cacheImage } from './TextToImageTabContent.cache'
import type { UseTextToImageReturn, TextToImageParams } from './TextToImageTabContent.types'
import { secureKeyManager, API_KEY_PREFIX, EMPTY_API_KEY } from './imports'

/**
 * 检测代理是否可用
 */
async function checkProxyAvailable(proxyUrl: string): Promise<boolean> {
  try {
    // 构建测试URL：通过代理访问一个简单的HTTP状态检测服务
    const testUrl = `${proxyUrl}?target=${encodeURIComponent(PROXY_CHECK.TEST_TARGET)}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), PROXY_CHECK.TIMEOUT)

    const response = await fetch(testUrl, {
      method: 'HEAD',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    return response.ok
  } catch {
    return false
  }
}

/**
 * 检查是否使用文件模式
 */
function isUsingFileMode(apiKey: string): boolean {
  return secureKeyManager.hasKeyFile() && !apiKey.startsWith(API_KEY_PREFIX)
}

/**
 * 使用文件模式生成图像
 */
async function generateWithFileMode(
  state: ReturnType<typeof useTextToImageState>,
  onImageGenerated?: (base64: string) => void
): Promise<void> {
  const params: TextToImageParams = {
    apiKey: EMPTY_API_KEY, // 密钥将在执行时从文件读取
    prompt: state.prompt.value,
    size: state.size.value,
    n: state.n.value,
    numInferenceSteps: state.numInferenceSteps.value,
    model: state.model.value,
    proxyUrl: state.proxyUrl.value || undefined,
    batchInterval: state.batchInterval.value,
    proxyType: state.proxyType.value,
    siyuanUrl: state.siyuanUrl.value,
    siyuanToken: state.siyuanToken.value
  }

  state.status.value = STATUS_MESSAGES.GENERATING

  // 使用 SecureKeyManager 执行请求
  const result = await secureKeyManager.executeWithKey(async (key: string) => {
    const requestParams = { ...params, apiKey: key }
    return await generateTextToImage(requestParams)
  })

  if (!result.success) {
    throw new Error(result.error || ERROR_MESSAGES.GENERATION_FAILED)
  }

  state.status.value = STATUS_MESSAGES.DOWNLOADING

  state.status.value = STATUS_MESSAGES.DOWNLOADING

  const imageUrls = result.imageUrls || []
  const proxyUrl = params.proxyUrl
  const isSiyuanProxy = params.proxyType === 'siyuan'
  const siyuanConfig = isSiyuanProxy ? {
    url: params.siyuanUrl || '',
    token: params.siyuanToken || ''
  } : undefined

  // 1. 并行下载并缓存所有图片
  // 这样可以避免多次请求同一张图片，并确保在更新 UI 前数据已准备好
  const downloadPromises = imageUrls.map(async (imageUrl) => {
    // 缓存 key：普通代理用代理URL，思源代理用原始URL
    const cacheKey = isSiyuanProxy ? imageUrl : (proxyUrl ? buildProxyUrl(imageUrl, proxyUrl) : imageUrl)
    try {
      const imageBase64 = await fetchImageWithProxy({
        imageUrl,
        proxyUrl: isSiyuanProxy ? undefined : proxyUrl,
        siyuanConfig
      })
      await cacheImage(imageBase64, cacheKey)
      return { url: imageUrl, base64: imageBase64 }
    } catch (error) {
      console.warn(`Failed to download and cache image: ${imageUrl}`, error)
      return null
    }
  })

  const downloadedImages = await Promise.all(downloadPromises)
  const validImages = downloadedImages.filter((img): img is { url: string, base64: string } => img !== null)

  // 2. 将最新的一张图像发送到主画布
  if (validImages.length > 0) {
    const firstImage = validImages[0]
    onImageGenerated && onImageGenerated(firstImage.base64)
  } else if (imageUrls.length > 0) {
    // 如果下载失败但有 URL，尝试抛出错误或只是警告
    throw new Error(ERROR_MESSAGES.NO_IMAGE_URL)
  }

  // 3. 更新生成的图像列表 (这将触发画廊更新)
  // 此时缓存已准备好，画廊可以正确加载
  if (result.imageUrls && result.imageUrls.length > 0) {
    state.generatedImages.value = result.imageUrls
  }

  state.status.value = STATUS_MESSAGES.LOADED
}

/**
 * 使用临时输入模式生成图像
 */
async function generateWithTempMode(
  state: ReturnType<typeof useTextToImageState>,
  onImageGenerated?: (base64: string) => void
): Promise<void> {
  const params: TextToImageParams = {
    apiKey: state.apiKey.value,
    prompt: state.prompt.value,
    size: state.size.value,
    n: state.n.value,
    numInferenceSteps: state.numInferenceSteps.value,
    model: state.model.value,
    proxyUrl: state.proxyUrl.value || undefined,
    batchInterval: state.batchInterval.value,
    proxyType: state.proxyType.value,
    siyuanUrl: state.siyuanUrl.value,
    siyuanToken: state.siyuanToken.value
  }

  state.status.value = STATUS_MESSAGES.GENERATING

  const result = await generateTextToImage(params)

  if (!result.success) {
    throw new Error(result.error || ERROR_MESSAGES.GENERATION_FAILED)
  }

  state.status.value = STATUS_MESSAGES.DOWNLOADING

  const imageUrls = result.imageUrls || []
  const proxyUrl = params.proxyUrl
  const isSiyuanProxy = params.proxyType === 'siyuan'
  const siyuanConfig = isSiyuanProxy ? {
    url: params.siyuanUrl || '',
    token: params.siyuanToken || ''
  } : undefined

  // 1. 并行下载并缓存所有图片
  // 这样可以避免多次请求同一张图片，并确保在更新 UI 前数据已准备好
  const downloadPromises = imageUrls.map(async (imageUrl) => {
    // 缓存 key：普通代理用代理URL，思源代理用原始URL
    const cacheKey = isSiyuanProxy ? imageUrl : (proxyUrl ? buildProxyUrl(imageUrl, proxyUrl) : imageUrl)
    try {
      const imageBase64 = await fetchImageWithProxy({
        imageUrl,
        proxyUrl: isSiyuanProxy ? undefined : proxyUrl,
        siyuanConfig
      })
      await cacheImage(imageBase64, cacheKey)
      return { url: imageUrl, base64: imageBase64 }
    } catch (error) {
      console.warn(`Failed to download and cache image: ${imageUrl}`, error)
      return null
    }
  })

  const downloadedImages = await Promise.all(downloadPromises)
  const validImages = downloadedImages.filter((img): img is { url: string, base64: string } => img !== null)

  // 2. 将最新的一张图像发送到主画布
  if (validImages.length > 0) {
    const firstImage = validImages[0]
    onImageGenerated && onImageGenerated(firstImage.base64)
  } else if (imageUrls.length > 0) {
    // 如果下载失败但有 URL，尝试抛出错误或只是警告
    throw new Error(ERROR_MESSAGES.NO_IMAGE_URL)
  }

  // 3. 更新生成的图像列表 (这将触发画廊更新)
  // 此时缓存已准备好，画廊可以正确加载
  if (result.imageUrls && result.imageUrls.length > 0) {
    state.generatedImages.value = result.imageUrls
  }

  state.status.value = STATUS_MESSAGES.LOADED
}

/**
 * 创建生成函数
 */
function createGenerate(
  state: ReturnType<typeof useTextToImageState>,
  onImageGenerated?: (base64: string) => void
): () => Promise<void> {
  return async (): Promise<void> => {
    if (!state.apiKeyValid.value || !state.prompt.value.trim()) {
      state.error.value = !state.apiKeyValid.value ? VALIDATION_ERRORS.INVALID_API_KEY : VALIDATION_ERRORS.EMPTY_PROMPT
      return
    }

    // 强制检查：如果生成数量 > 4，必须设置批次间隔
    if (state.n.value > 4 && (!state.batchInterval.value || state.batchInterval.value <= 0)) {
      state.error.value = "批量生成数量大于4张时，为了防止请求超限，必须设置批次间隔 (建议 > 1000ms)"
      return
    }

    // 检测代理可用性（仅在使用默认代理时，思源代理不需要检查）
    const isSiyuanProxy = state.proxyType.value === 'siyuan'
    const currentProxyUrl = state.proxyUrl.value || DEFAULTS.PROXY_URL
    const isDefaultProxy = currentProxyUrl === DEFAULTS.PROXY_URL
    const shouldCheckProxy = !isSiyuanProxy && isDefaultProxy

    if (shouldCheckProxy) {
      state.status.value = PROXY_CHECK.STATUS.CHECKING
      const isProxyAvailable = await checkProxyAvailable(currentProxyUrl)

      if (!isProxyAvailable) {
        // 显示警告弹窗并等待用户响应
        const shouldContinue = await state.showProxyWarningAndWait()
        if (!shouldContinue) {
          state.status.value = DEFAULTS.EMPTY_STRING
          return
        }
      }
    }

    state.isGenerating.value = true
    state.error.value = DEFAULTS.EMPTY_STRING
    state.status.value = STATUS_MESSAGES.SUBMITTING

    try {
      await (isUsingFileMode(state.apiKey.value)
        ? generateWithFileMode(state, onImageGenerated)
        : generateWithTempMode(state, onImageGenerated))
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : ERROR_MESSAGES.GENERATION_FAILED
      state.error.value = message
      console.error(ERROR_MESSAGES.TEXT_TO_IMAGE_ERROR, err)
    } finally {
      state.isGenerating.value = false
    }
  }
}

/**
 * 创建重置函数
 */
function createReset(state: ReturnType<typeof useTextToImageState>): () => void {
  return (): void => {
    state.apiKey.value = DEFAULTS.EMPTY_STRING
    state.prompt.value = DEFAULTS.EMPTY_STRING
    state.size.value = DEFAULTS.SIZE
    state.n.value = DEFAULTS.N
    state.numInferenceSteps.value = DEFAULTS.NUM_INFERENCE_STEPS
    state.model.value = DEFAULTS.MODEL
    state.proxyUrl.value = DEFAULTS.PROXY_URL
    state.batchInterval.value = 0
    state.proxyType.value = 'default'
    state.siyuanUrl.value = 'http://127.0.0.1:6806'
    state.siyuanToken.value = ''
    state.showAdvanced.value = DEFAULTS.SHOW_ADVANCED
    state.error.value = DEFAULTS.EMPTY_STRING
    state.status.value = DEFAULTS.EMPTY_STRING
  }
}

export function useTextToImage(onImageGenerated?: (base64: string) => void): UseTextToImageReturn {
  const state = useTextToImageState()

  const generate = createGenerate(state, onImageGenerated)
  const reset = createReset(state)

  return {
    apiKey: state.apiKey,
    prompt: state.prompt,
    size: state.size,
    n: state.n,
    numInferenceSteps: state.numInferenceSteps,
    model: state.model,
    proxyUrl: state.proxyUrl,
    batchInterval: state.batchInterval,
    proxyType: state.proxyType,
    siyuanUrl: state.siyuanUrl,
    siyuanToken: state.siyuanToken,
    showAdvanced: state.showAdvanced,
    isGenerating: state.isGenerating,
    error: state.error,
    status: state.status,
    generatedImages: state.generatedImages,
    apiKeyValid: state.apiKeyValid,
    showProxyWarning: state.showProxyWarning,
    handleProxyWarningResponse: state.handleProxyWarningResponse,
    generate,
    reset
  }
}
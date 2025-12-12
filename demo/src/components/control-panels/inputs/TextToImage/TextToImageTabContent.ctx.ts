/**
 * 文本生成图像上下文（组合式函数）
 */

import { useTextToImageState } from './TextToImageTabContent.state'
import { generateTextToImage } from './TextToImageTabContent.utils'
import { fetchImageAsBase64, buildProxyUrl } from './imports'
import {
  VALIDATION_ERRORS,
  STATUS_MESSAGES,
  ERROR_MESSAGES,
  DEFAULTS,
} from './TextToImageTabContent.constants'
import { cacheImage } from './TextToImageTabContent.cache'
import type { UseTextToImageReturn, TextToImageParams } from './TextToImageTabContent.types'
import { secureKeyManager, API_KEY_PREFIX, EMPTY_API_KEY } from './imports'

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
    proxyUrl: state.proxyUrl.value || undefined
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

  // 更新生成的图像列表
  if (result.imageUrls && result.imageUrls.length > 0) {
    state.generatedImages.value = result.imageUrls
  }

  // 将最新的一张图像发送到主画布
  const latestImageUrl = result.imageUrls?.[0]
  if (!latestImageUrl) {
    throw new Error(ERROR_MESSAGES.NO_IMAGE_URL)
  }
  const proxyUrl = params.proxyUrl
  const proxiedUrl = proxyUrl ? buildProxyUrl(latestImageUrl, proxyUrl) : latestImageUrl
  const base64 = await fetchImageAsBase64(proxiedUrl)
  onImageGenerated && onImageGenerated(base64)
  
  // 缓存所有生成的图片到本地存储，防止 URL 失效
  // 使用代理URL作为缓存key，确保与ImageGallery中的查询key一致
  for (const imageUrl of result.imageUrls || []) {
    const imageProxiedUrl = proxyUrl ? buildProxyUrl(imageUrl, proxyUrl) : imageUrl
    const imageBase64 = await fetchImageAsBase64(imageProxiedUrl)
    await cacheImage(imageBase64, imageProxiedUrl)
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
    proxyUrl: state.proxyUrl.value || undefined
  }

  state.status.value = STATUS_MESSAGES.GENERATING

  const result = await generateTextToImage(params)

  if (!result.success) {
    throw new Error(result.error || ERROR_MESSAGES.GENERATION_FAILED)
  }

  state.status.value = STATUS_MESSAGES.DOWNLOADING

  // 更新生成的图像列表
  if (result.imageUrls && result.imageUrls.length > 0) {
    state.generatedImages.value = result.imageUrls
  }

  // 将最新的一张图像发送到主画布
  const latestImageUrl = result.imageUrls?.[0]
  if (!latestImageUrl) {
    throw new Error(ERROR_MESSAGES.NO_IMAGE_URL)
  }
  const proxyUrl = params.proxyUrl
  const proxiedUrl = proxyUrl ? buildProxyUrl(latestImageUrl, proxyUrl) : latestImageUrl
  const base64 = await fetchImageAsBase64(proxiedUrl)
  onImageGenerated && onImageGenerated(base64)
  
  // 缓存所有生成的图片到本地存储，防止 URL 失效
  // 使用代理URL作为缓存key，确保与ImageGallery中的查询key一致
  for (const imageUrl of result.imageUrls || []) {
    const imageProxiedUrl = proxyUrl ? buildProxyUrl(imageUrl, proxyUrl) : imageUrl
    const imageBase64 = await fetchImageAsBase64(imageProxiedUrl)
    await cacheImage(imageBase64, imageProxiedUrl)
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
    showAdvanced: state.showAdvanced,
    isGenerating: state.isGenerating,
    error: state.error,
    status: state.status,
    generatedImages: state.generatedImages,
    apiKeyValid: state.apiKeyValid,
    generate,
    reset
  }
}
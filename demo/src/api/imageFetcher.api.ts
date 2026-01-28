/**
 * 图像获取 API
 *
 * Phase 5 重构：返回 Blob URL 而非 Base64
 * - 直接获取 Blob 并创建 Blob URL
 * - 避免 Base64 编码带来的 33% 体积膨胀
 * - 保持向后兼容性
 *
 * Phase 6 重构：添加代理支持的 Blob 获取
 * - fetchImageWithProxyAsBlob: 支持 SiYuan 代理和传统代理
 * - 直接返回 Blob 对象，避免 Base64 中间转换
 */

import type {
  FetchImageParams,
  FetchImageAsBlobResult,
  SiyuanProxyResponse
} from './types'
import {
  cacheImageBlob,
  getCachedImageByUrl
} from '../components/control-panels/inputs/TextToImage/TextToImageTabContent.indexedDB.ctx'
import {
  POLLING_INTERVAL_MS,
  MAX_POLLING_ATTEMPTS,
  LOG_MESSAGES,
  ERROR_MESSAGES
} from './imageFetcher.constants'
import {
  SIYUAN_PROXY_ENDPOINT,
  SIYUAN_TOKEN_PREFIX,
  REQUEST_TIMEOUT_MS,
  METHOD_POST,
  METHOD_GET,
  DEFAULT_MIME_TYPE,
  RESPONSE_ENCODING_BASE64,
  HEADER_CONTENT_TYPE_KEY,
  HEADER_CONTENT_TYPE_KEY_LOWER,
  CONTENT_TYPE_JSON
} from './constants'
import {
  buildProxyUrl,
  SIYUAN_PROXY_ERROR,
  FETCH_IMAGE_RETRY_LOG,
  FAILED_TO_FETCH_IMAGE,
  SIYUAN_NO_DATA_ERROR,
  SIYUAN_MAX_RETRIES_ERROR,
  SIYUAN_EMPTY_BODY_ERROR,
  normalizeUrl,
  buildSiyuanProxyUrl,
  buildSiyuanAuthHeader
} from './templates'
import { robustFetch } from './fetchWrapper.api'

/**
 * 轮询图像 URL 直到成功获取
 */
async function pollImageUrl(url: string): Promise<Response> {
  for (let attempt = 1; attempt <= MAX_POLLING_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(url)
      if (response.ok) {
        return response
      }
      console.warn(LOG_MESSAGES.POLL_ATTEMPT(attempt, response.status))
    } catch (error) {
      console.warn(LOG_MESSAGES.POLL_NETWORK_ERROR(attempt, error))
    }
    await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL_MS))
  }
  throw new Error(ERROR_MESSAGES.TIMEOUT(MAX_POLLING_ATTEMPTS))
}

/**
 * 获取图像并返回 Blob URL (新接口)
 * 直接获取 Blob 并缓存，避免 Base64 编码开销
 */
export async function fetchImageAsBlobUrl(url: string): Promise<string> {
  const cachedImage = await getCachedImageByUrl(url)
  
  if (cachedImage) {
    return cachedImage
  }

  const response = await pollImageUrl(url)
  const blob = await response.blob()
  const mimeType = blob.type || 'image/png'

  await cacheImageBlob(blob, url, mimeType)
  
  const cached = await getCachedImageByUrl(url)
  if (!cached) {
    throw new Error(ERROR_MESSAGES.CACHE_FAILED)
  }
  return cached
}

/**
 * 将图像 URL 转换为 base64，带缓存功能
 * @deprecated 建议使用 fetchImageAsBlobUrl 获取 Blob URL
 * @简洁函数 向后兼容包装函数，内部已改用 Blob 缓存
 */
export async function fetchImageAsBase64(url: string): Promise<string> {
  return fetchImageAsBlobUrl(url)
}

// ============================================================================
// Phase 6: 代理支持的 Blob 获取
// ============================================================================

const MAX_SIYUAN_RETRIES = 3
const RETRY_DELAY_BASE_MS = 1000

/**
 * 将 Base64 字符串转换为 Blob 对象
 * @简洁函数 Base64 解码并创建 Blob
 */
function base64ToBlob(base64: string, mimeType: string): Blob {
  const binaryString = atob(base64)
  const len = binaryString.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return new Blob([bytes], { type: mimeType })
}

/**
 * 从响应头中提取 Content-Type
 * @简洁函数 提取 MIME 类型
 */
function extractContentType(headers: Record<string, string[]> | undefined): string {
  if (!headers) return DEFAULT_MIME_TYPE
  const contentTypeArr = headers[HEADER_CONTENT_TYPE_KEY] || headers[HEADER_CONTENT_TYPE_KEY_LOWER]
  return contentTypeArr?.[0] || DEFAULT_MIME_TYPE
}

/**
 * 使用 SiYuan 代理获取图片并返回 Blob
 */
async function fetchImageWithSiyuanAsBlob(
  imageUrl: string,
  siyuanConfig: { url: string; token: string }
): Promise<FetchImageAsBlobResult> {
  const normalizedImageUrl = normalizeUrl(imageUrl)
  const siyuanUrl = buildSiyuanProxyUrl(siyuanConfig.url, SIYUAN_PROXY_ENDPOINT)

  let lastError: Error | null = null

  for (let attempt = 0; attempt < MAX_SIYUAN_RETRIES; attempt++) {
    const response = await robustFetch<SiyuanProxyResponse>(siyuanUrl, {
      method: METHOD_POST,
      headers: {
        Authorization: buildSiyuanAuthHeader(siyuanConfig.token, SIYUAN_TOKEN_PREFIX),
        'Content-Type': CONTENT_TYPE_JSON
      },
      body: JSON.stringify({
        url: normalizedImageUrl,
        method: METHOD_GET,
        headers: [],
        timeout: REQUEST_TIMEOUT_MS,
        responseEncoding: RESPONSE_ENCODING_BASE64
      })
    })

    if (response.code !== 0) {
      throw new Error(SIYUAN_PROXY_ERROR(response.msg))
    }

    if (!response.data) {
      lastError = new Error(SIYUAN_NO_DATA_ERROR)
      console.warn(FETCH_IMAGE_RETRY_LOG(attempt + 1, MAX_SIYUAN_RETRIES))
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_BASE_MS * (attempt + 1)))
      continue
    }

    if (!response.data.body) {
      throw new Error(SIYUAN_EMPTY_BODY_ERROR)
    }

    const mimeType = extractContentType(response.data.headers)
    const blob = base64ToBlob(response.data.body, mimeType)
    const blobUrl = URL.createObjectURL(blob)

    return { blob, blobUrl, mimeType }
  }

  throw lastError || new Error(SIYUAN_MAX_RETRIES_ERROR)
}

/**
 * 使用传统代理获取图片并返回 Blob
 */
async function fetchImageWithTraditionalProxyAsBlob(
  imageUrl: string,
  proxyUrl?: string
): Promise<FetchImageAsBlobResult> {
  const finalUrl = proxyUrl ? buildProxyUrl(imageUrl, proxyUrl) : imageUrl
  const response = await fetch(finalUrl)

  if (!response.ok) {
    throw new Error(FAILED_TO_FETCH_IMAGE(response.status))
  }

  const blob = await response.blob()
  const mimeType = blob.type || DEFAULT_MIME_TYPE
  const blobUrl = URL.createObjectURL(blob)

  return { blob, blobUrl, mimeType }
}

/**
 * 通过代理（思源代理或传统代理）获取图片并返回 Blob
 * 这是 fetchImageWithProxy 的新版本，直接返回 Blob 避免 Base64 编码开销
 */
export async function fetchImageWithProxyAsBlob(
  params: FetchImageParams
): Promise<FetchImageAsBlobResult> {
  const { imageUrl, proxyUrl, siyuanConfig } = params

  if (siyuanConfig) {
    return fetchImageWithSiyuanAsBlob(imageUrl, siyuanConfig)
  }

  return fetchImageWithTraditionalProxyAsBlob(imageUrl, proxyUrl)
}

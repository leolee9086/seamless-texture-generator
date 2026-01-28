/**
 * API 相关模板字符串
 */
/** @简洁函数 构建代理 URL */
export function buildProxyUrl(targetUrl: string, proxyUrl: string): string {
  const encoded = encodeURIComponent(targetUrl)
  return `${proxyUrl}?target=${encoded}`
}
export const TIMEOUT_MESSAGE = (timeout: number): string => `请求超时 (${timeout}ms)`
export const SERVER_ERROR_MESSAGE = (status: number): string => `服务器错误 ${status}`
export const HTTP_ERROR_MESSAGE = (status: number): string => `HTTP ${status}`
export const UNKNOWN_NETWORK_ERROR = '未知网络错误'
export const BEARER_TOKEN = (apiKey: string): string => `Bearer ${apiKey}`

// ModelScope API 模板
export const IMAGE_GENERATION_URL = (proxyUrl: string, endpoint: string): string => `${proxyUrl}/${endpoint}`
export const TASK_STATUS_URL = (proxyUrl: string, endpoint: string, taskId: string): string => `${proxyUrl}/${endpoint}/${taskId}`

// SiYuan Proxy 模板
/** @简洁函数 URL 构建模板函数 */
export const SIYUAN_PROXY_URL = (baseUrl: string, endpoint: string): string => `${baseUrl}${endpoint}`
/** @简洁函数 错误消息模板函数 */
export const SIYUAN_PROXY_ERROR = (msg: string): string => `SiYuan Proxy Error: ${msg}`
/** @简洁函数 重试日志模板函数 */
export const SIYUAN_PROXY_RETRY_LOG = (attempt: number, maxRetries: number): string =>
  `[SiYuan Proxy] data is null, retrying (${attempt}/${maxRetries})...`
/** @简洁函数 重试日志模板函数 */
export const FETCH_IMAGE_RETRY_LOG = (attempt: number, maxRetries: number): string =>
  `[fetchImageWithProxy] data is null, retrying (${attempt}/${maxRetries})...`
/** @简洁函数 错误消息模板函数 */
export const FAILED_TO_FETCH_IMAGE = (status: number): string => `Failed to fetch image: ${status}`
/** @简洁函数 Data URL 构建模板函数 */
export const DATA_URL_TEMPLATE = (contentType: string, base64Data: string): string =>
  `data:${contentType};base64,${base64Data}`

// 错误消息常量
export const SIYUAN_NO_DATA_ERROR = 'SiYuan Proxy Error: No data returned'
export const SIYUAN_MAX_RETRIES_ERROR = 'SiYuan Proxy Error: Max retries exceeded'
export const SIYUAN_EMPTY_BODY_ERROR = 'SiYuan Proxy Error: Empty image body'

// URL 规范化正则
export const URL_NORMALIZE_REGEX = /([^:])\/+/g
export const URL_NORMALIZE_REPLACEMENT = '$1/'
export const TRAILING_SLASH_REGEX = /\/+$/
export const EMPTY_STRING = ''

/** @简洁函数 规范化 URL，移除多余斜杠 */
export function normalizeUrl(url: string): string {
  return url.replace(URL_NORMALIZE_REGEX, URL_NORMALIZE_REPLACEMENT)
}

/** @简洁函数 移除尾部斜杠 */
export function removeTrailingSlash(url: string): string {
  return url.replace(TRAILING_SLASH_REGEX, EMPTY_STRING)
}

/** @简洁函数 构建 SiYuan 代理完整 URL */
export function buildSiyuanProxyUrl(baseUrl: string, endpoint: string): string {
  return `${removeTrailingSlash(baseUrl)}${endpoint}`
}

/** @简洁函数 构建 Authorization 头 */
export function buildSiyuanAuthHeader(token: string, prefix: string): string {
  return `${prefix}${token}`
}
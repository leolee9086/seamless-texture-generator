/**
 * SecureApiKeyInput 工具函数
 */

import { secureKeyManager } from './SecureApiKeyInput.ctx'
import { API_KEY_PREFIX, DISPLAY_SUFFIX, API_KEY_DISPLAY_LENGTH, API_KEY_DISPLAY_TEMPLATE } from './SecureApiKeyInput.constants'

/**
 * 检查是否有有效的 API Key
 * @param apiKey - 临时输入的 API Key
 * @returns 是否有有效的 API Key
 */
export function hasValidApiKey(apiKey: string): boolean {
  // 检查临时输入的 API Key
  if (apiKey && apiKey.startsWith(API_KEY_PREFIX)) {
    return true
  }
  
  // 检查是否有密钥文件
  if (secureKeyManager.hasKeyFile()) {
    return true
  }
  
  return false
}

/**
 * 格式化 API Key 显示
 * @param apiKey - API Key
 * @returns 格式化后的显示文本
 */
export function formatApiKeyDisplay(apiKey: string): string {
  if (!apiKey) return ''
  
  if (apiKey.startsWith(API_KEY_PREFIX)) {
    return API_KEY_DISPLAY_TEMPLATE(apiKey.substring(0, API_KEY_DISPLAY_LENGTH), DISPLAY_SUFFIX)
  }
  
  return apiKey
}

/**
 * 验证 API Key 格式
 * @param apiKey - API Key
 * @returns 是否为有效格式
 */
export function validateApiKeyFormat(apiKey: string): boolean {
  return apiKey.startsWith(API_KEY_PREFIX) && apiKey.length > API_KEY_DISPLAY_LENGTH
}
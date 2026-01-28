/**
 * IndexedDB 缓存路径模板
 */

import { INDEXED_DB } from './TextToImageTabContent.constants'

/** @简洁函数 路径构建工具函数，用于生成 IndexedDB 存储路径 */
export function buildImageCachePath(url: string): string {
  return `${INDEXED_DB.STORE_NAME}/${url}`
}

/** @简洁函数 路径构建工具函数，用于生成 URL 列表元数据路径 */
export function buildUrlListMetaPath(): string {
  return `${INDEXED_DB.URL_LIST_STORE_NAME}/${INDEXED_DB.URL_LIST_ID}`
}

/** @简洁函数 错误消息模板函数 */
export function buildDeleteCacheFailedMessage(url: string): string {
  return `Failed to delete cache ${url}`
}

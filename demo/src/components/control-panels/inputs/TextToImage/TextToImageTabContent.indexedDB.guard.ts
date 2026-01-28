/**
 * IndexedDB 相关类型守卫
 */

import type { ImageCacheItem, ImageCacheItemV1, ImageCacheItemV2 } from './TextToImageTabContent.indexedDB.types'

/** @简洁函数 IDBOpenDBRequest 类型谓词守卫 */
export function isIDBOpenDBRequest(target: unknown): target is IDBOpenDBRequest {
  return target instanceof IDBOpenDBRequest
}

/** @简洁函数 IDBDatabase 类型谓词守卫 */
export function isIDBDatabase(target: unknown): target is IDBDatabase {
  return target instanceof IDBDatabase
}

/** @简洁函数 IDBRequest 类型谓词守卫 */
export function isIDBRequest(target: unknown): target is IDBRequest {
  return target instanceof IDBRequest
}

/** @简洁函数 IDBTransaction 类型谓词守卫 */
export function isIDBTransaction(target: unknown): target is IDBTransaction {
  return target instanceof IDBTransaction
}

/** @简洁函数 IDBObjectStore 类型谓词守卫 */
export function isIDBObjectStore(target: unknown): target is IDBObjectStore {
  return target instanceof IDBObjectStore
}

/**
 * 检查是否为 V2 版本的缓存项 (Blob 存储)
 * V2 版本使用原生 Blob 存储，避免 Base64 编码开销
 */
export function isImageCacheItemV2(item: unknown): item is ImageCacheItemV2 {
  if (typeof item !== 'object' || item === null) {
    return false
  }
  const record = item as Record<string, unknown>
  const hasRequiredFields = (
    record.version === 2 &&
    typeof record.url === 'string' &&
    record.blob instanceof Blob &&
    typeof record.timestamp === 'number' &&
    typeof record.mimeType === 'string'
  )
  return hasRequiredFields
}

/**
 * 检查是否为 V1 版本的缓存项 (Base64 存储)
 * V1 版本使用 Base64 字符串存储，用于向后兼容
 */
export function isImageCacheItemV1(item: unknown): item is ImageCacheItemV1 {
  if (typeof item !== 'object' || item === null) {
    return false
  }
  const record = item as Record<string, unknown>
  const hasRequiredFields = (
    typeof record.url === 'string' &&
    typeof record.base64 === 'string' &&
    typeof record.timestamp === 'number' &&
    (record.version === undefined || record.version === 1)
  )
  return hasRequiredFields
}

/**
 * 检查是否为有效的缓存项 (V1 或 V2)
 * 统一类型守卫，支持新旧两种缓存格式
 */
export function isImageCacheItem(item: unknown): item is ImageCacheItem {
  const isV1 = isImageCacheItemV1(item)
  const isV2 = isImageCacheItemV2(item)
  return isV1 || isV2
}

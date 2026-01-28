/**
 * IndexedDB 图片缓存工具类 (Powered by IndexDBFS)
 * 
 * Phase 5 重构：支持 Blob 存储，避免 Base64 编码开销
 * - 新数据使用 V2 格式 (Blob 存储)
 * - 自动迁移旧版 V1 数据 (Base64 -> Blob)
 * - 返回 Blob URL 用于显示
 */
import { IndexDBFS } from './imports'
import { IMAGE_CACHE, INDEXED_DB } from './TextToImageTabContent.constants'
import { isImageCacheItemV1, isImageCacheItemV2 } from './TextToImageTabContent.indexedDB.guard'
import { 
  buildImageCachePath, 
  buildUrlListMetaPath, 
  buildDeleteCacheFailedMessage 
} from './TextToImageTabContent.indexedDB.templates'
import type { ImageCacheItem, ImageCacheItemV2, UrlListMeta } from './TextToImageTabContent.indexedDB.types'
import { CACHE_VERSION } from './TextToImageTabContent.indexedDB.types'

// 初始化 FS 实例
const fs = new IndexDBFS(
  INDEXED_DB.DB_NAME,
  [INDEXED_DB.STORE_NAME, INDEXED_DB.URL_LIST_STORE_NAME],
  INDEXED_DB.DB_VERSION
)

// Blob URL 管理器 - 跟踪已创建的 Blob URL 以便释放
const blobUrlRegistry = new Map<string, string>()

/**
 * 释放指定 URL 对应的 Blob URL
 */
function revokeBlobUrl(url: string): void {
  const blobUrl = blobUrlRegistry.get(url)
  if (blobUrl) {
    URL.revokeObjectURL(blobUrl)
    blobUrlRegistry.delete(url)
  }
}

/**
 * 注册 Blob URL 以便后续释放
 * @简洁函数 Blob URL 生命周期管理工具函数
 */
function registerBlobUrl(url: string, blobUrl: string): void {
  revokeBlobUrl(url)
  blobUrlRegistry.set(url, blobUrl)
}

/**
 * 将 Base64 字符串转换为 Blob
 * 使用 atob + Uint8Array 方式，避免 fetch API 限制
 */
function base64ToBlob(base64: string): { blob: Blob; mimeType: string } {
  // 解析 data URL 格式: data:image/png;base64,xxxxx
  const matches = base64.match(/^data:([^;]+);base64,(.+)$/)
  if (!matches) {
    throw new Error(INDEXED_DB.ERROR_MESSAGES.INVALID_BASE64_FORMAT)
  }
  const mimeType = matches[1]
  const base64Data = matches[2]
  
  // 使用 atob 解码 Base64
  const binaryString = atob(base64Data)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  
  const blob = new Blob([bytes], { type: mimeType })
  return { blob, mimeType }
}

/**
 * 缓存图片到 IndexedDB (使用 Blob 格式)
 */
export async function cacheImageBlob(blob: Blob, url: string, mimeType: string): Promise<void> {
  if (!url) return

  try {
    const item: ImageCacheItemV2 = { 
      url, 
      blob, 
      timestamp: Date.now(),
      version: CACHE_VERSION.V2,
      mimeType
    }
    await fs.write(buildImageCachePath(url), item)

    const urlList = await getUrlList()
    if (!urlList.includes(url)) {
      const updatedUrlList = [...urlList, url]
      await saveUrlList(updatedUrlList)
    }

    await cleanupOldCache()
  } catch (error) {
    console.warn(IMAGE_CACHE.ERROR_MESSAGES.CACHE_FAILED, error)
  }
}

/**
 * 缓存图片到 IndexedDB (兼容旧接口，接收 Base64 但存储为 Blob)
 * @deprecated 建议使用 cacheImageBlob 直接存储 Blob
 */
export async function cacheImage(base64: string, url: string): Promise<void> {
  if (!url) return

  try {
    const { blob, mimeType } = base64ToBlob(base64)
    await cacheImageBlob(blob, url, mimeType)
  } catch (error) {
    console.warn(IMAGE_CACHE.ERROR_MESSAGES.CACHE_FAILED, error)
  }
}

/**
 * 清理旧的缓存
 */
async function cleanupOldCache(): Promise<void> {
  const urlList = await getUrlList()

  if (urlList.length <= IMAGE_CACHE.MAX_COUNT) {
    return
  }

  const urlsToRemove = urlList.slice(0, urlList.length - IMAGE_CACHE.MAX_COUNT)
  const updatedUrlList = urlList.slice(urlList.length - IMAGE_CACHE.MAX_COUNT)

  await saveUrlList(updatedUrlList)

  for (const url of urlsToRemove) {
    try {
      revokeBlobUrl(url)
      await fs.delete(buildImageCachePath(url))
    } catch (err) {
      console.warn(buildDeleteCacheFailedMessage(url), err)
    }
  }
}

/**
 * 迁移 V1 缓存项到 V2 格式
 */
async function migrateV1ToV2(item: ImageCacheItem, url: string): Promise<ImageCacheItemV2 | null> {
  if (!isImageCacheItemV1(item)) {
    return null
  }

  try {
    const { blob, mimeType } = base64ToBlob(item.base64)
    const v2Item: ImageCacheItemV2 = {
      url,
      blob,
      timestamp: item.timestamp,
      version: CACHE_VERSION.V2,
      mimeType
    }
    
    await fs.write(buildImageCachePath(url), v2Item)
    return v2Item
  } catch (error) {
    console.warn(INDEXED_DB.ERROR_MESSAGES.FAILED_TO_MIGRATE_V1_TO_V2, error)
    return null
  }
}

/**
 * 获取所有缓存的图片 (返回 Blob URL)
 */
export async function getCachedImages(): Promise<string[]> {
  try {
    const urlList = await getUrlList()
    const images: string[] = []

    for (const url of urlList) {
      const blobUrl = await getCachedImageByUrl(url)
      if (blobUrl) {
        images.push(blobUrl)
      }
    }

    return images
  } catch (error) {
    console.warn(INDEXED_DB.ERROR_MESSAGES.FAILED_TO_GET_IMAGES, error)
    return []
  }
}

/**
 * 处理 V2 格式缓存项，返回 Blob URL
 */
function handleV2CacheItem(item: ImageCacheItemV2, url: string): string {
  const blobUrl = URL.createObjectURL(item.blob)
  registerBlobUrl(url, blobUrl)
  return blobUrl
}

/**
 * 处理 V1 格式缓存项，迁移后返回 Blob URL
 */
async function handleV1CacheItem(item: ImageCacheItem, url: string): Promise<string | null> {
  if (!isImageCacheItemV1(item)) {
    return null
  }
  
  const v2Item = await migrateV1ToV2(item, url)
  if (!v2Item) {
    // 迁移失败，返回原始 Base64
    return item.base64
  }
  
  const blobUrl = URL.createObjectURL(v2Item.blob)
  registerBlobUrl(url, blobUrl)
  return blobUrl
}

/**
 * 根据 URL 获取缓存的图片 (返回 Blob URL)
 * 自动处理 V1 -> V2 迁移
 */
export async function getCachedImageByUrl(url: string): Promise<string | null> {
  if (!url) return null

  try {
    // 检查是否已有 Blob URL
    const existingBlobUrl = blobUrlRegistry.get(url)
    if (existingBlobUrl) {
      return existingBlobUrl
    }

    const item = await fs.read<ImageCacheItem>(buildImageCachePath(url))
    if (!item) {
      return null
    }

    // 处理 V2 格式
    if (isImageCacheItemV2(item)) {
      return handleV2CacheItem(item, url)
    }

    // 处理 V1 格式 - 自动迁移
    return await handleV1CacheItem(item, url)
  } catch (error) {
    console.warn(INDEXED_DB.ERROR_MESSAGES.FAILED_TO_GET_IMAGE, error)
    return null
  }
}

/**
 * 获取 URL 列表
 */
async function getUrlList(): Promise<string[]> {
  try {
    const meta = await fs.read<UrlListMeta>(buildUrlListMetaPath())
    return meta?.urls || []
  } catch (error) {
    console.warn(INDEXED_DB.ERROR_MESSAGES.FAILED_TO_GET_URL_LIST, error)
    return []
  }
}

/** @简洁函数 URL 列表持久化工具函数 */
async function saveUrlList(urls: string[]): Promise<void> {
  const meta: UrlListMeta = { id: INDEXED_DB.URL_LIST_ID, urls }
  await fs.write(buildUrlListMetaPath(), meta)
}

/**
 * 清空所有缓存
 */
export async function clearAllCache(): Promise<void> {
  try {
    for (const [, blobUrl] of blobUrlRegistry) {
      URL.revokeObjectURL(blobUrl)
    }
    blobUrlRegistry.clear()

    await fs.clear(INDEXED_DB.STORE_NAME)
    await fs.clear(INDEXED_DB.URL_LIST_STORE_NAME)
  } catch (error) {
    console.warn(INDEXED_DB.ERROR_MESSAGES.FAILED_TO_CLEAR_CACHE, error)
  }
}

/**
 * 释放所有 Blob URL (用于组件卸载时调用)
 */
export function releaseAllBlobUrls(): void {
  for (const [, blobUrl] of blobUrlRegistry) {
    URL.revokeObjectURL(blobUrl)
  }
  blobUrlRegistry.clear()
}

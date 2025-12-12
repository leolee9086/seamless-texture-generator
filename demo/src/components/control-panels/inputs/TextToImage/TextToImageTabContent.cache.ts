/**
 * 图片缓存工具函数
 */

import { IMAGE_CACHE } from './TextToImageTabContent.constants'
import { isNonNullString, isStringArray } from './TextToImageTabContent.cache.guard'
import type { 
  CacheImageFunction,
  GetCachedImagesFunction,
  GetCachedImageByUrlFunction,
  ClearAllCacheFunction
} from './TextToImageTabContent.cache.types'
import * as indexedDBFunctions from './TextToImageTabContent.indexedDB.ctx'

/**
 * 缓存图片到 IndexedDB
 */
export const cacheImage: CacheImageFunction = async (base64: string, url: string): Promise<void> => {
  if (!url) {
    return
  }

  try {
    await indexedDBFunctions.cacheImage(base64, url)
  } catch (error) {
    console.warn(IMAGE_CACHE.ERROR_MESSAGES.CACHE_FAILED, error)
  }
}

/**
 * 获取所有缓存的图片
 */
export const getCachedImages: GetCachedImagesFunction = async (): Promise<string[]> => {
  try {
    const images = await indexedDBFunctions.getCachedImages()
    return images.filter(isNonNullString)
  } catch (error) {
    console.warn('Failed to get cached images:', error)
    return []
  }
}

/**
 * 根据 URL 获取缓存的图片
 */
export const getCachedImageByUrl: GetCachedImageByUrlFunction = async (url: string): Promise<string | null> => {
  if (!url) {
    return null
  }

  try {
    return await indexedDBFunctions.getCachedImageByUrl(url)
  } catch (error) {
    console.warn('Failed to get cached image by URL:', error)
    return null
  }
}

/**
 * 清空所有缓存
 */
export const clearAllCache: ClearAllCacheFunction = async (): Promise<void> => {
  try {
    await indexedDBFunctions.clearAllCache()
  } catch (error) {
    console.warn('Failed to clear all cache:', error)
  }
}

/**
 * 迁移 localStorage 缓存到 IndexedDB
 * 这个函数用于从旧的 localStorage 迁移数据到新的 IndexedDB
 */
export const migrateFromLocalStorage = async (): Promise<void> => {
  try {
    // 检查是否还有 localStorage 中的旧数据
    const urlListKey = IMAGE_CACHE.URL_LIST_KEY
    const listData = localStorage.getItem(urlListKey)
    
    if (!listData) {
      return // 没有旧数据需要迁移
    }

    const parsedData = JSON.parse(listData)
    
    if (!isStringArray(parsedData)) {
      console.warn('Invalid URL list data in localStorage, skipping migration')
      return
    }

    const urlList = parsedData
    
    for (const url of urlList) {
      const urlKey = IMAGE_CACHE.URL_PREFIX + url
      const base64 = localStorage.getItem(urlKey)
      
      if (base64) {
        // 迁移到 IndexedDB
        await indexedDBFunctions.cacheImage(base64, url)
        
        // 清除 localStorage 中的数据
        localStorage.removeItem(urlKey)
      }
    }
    
    // 清除 localStorage 中的 URL 列表
    localStorage.removeItem(urlListKey)
    
    console.warn('Successfully migrated cache from localStorage to IndexedDB')
  } catch (error) {
    console.warn('Failed to migrate cache from localStorage:', error)
  }
}
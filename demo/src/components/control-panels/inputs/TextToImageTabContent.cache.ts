/**
 * 图片缓存工具函数
 */

import { IMAGE_CACHE } from './TextToImageTabContent.constants'
import { isNonNullString } from './TextToImageTabContent.cache.guard'

/**
 * 缓存图片到本地存储
 */
export async function cacheImage(base64: string, url: string): Promise<void> {
  if (!url) {
    return
  }

  try {
    const urlKey = IMAGE_CACHE.URL_PREFIX + url
    localStorage.setItem(urlKey, base64)
    
    // 更新 URL 列表
    const urlList = getUrlList()
    if (!urlList.includes(url)) {
      urlList.push(url)
      localStorage.setItem(IMAGE_CACHE.URL_LIST_KEY, JSON.stringify(urlList))
    }
    
    await cleanupOldCache()
  } catch (error) {
    console.warn(IMAGE_CACHE.ERROR_MESSAGES.CACHE_FAILED, error)
  }
}

/**
 * 清理旧的缓存
 */
async function cleanupOldCache(): Promise<void> {
  const urlList = getUrlList()
  
  if (urlList.length <= IMAGE_CACHE.MAX_COUNT) {
    return
  }
  
  // 移除超出限制的最旧的 URL
  const urlsToRemove = urlList.slice(0, urlList.length - IMAGE_CACHE.MAX_COUNT)
  const updatedUrlList = urlList.slice(urlList.length - IMAGE_CACHE.MAX_COUNT)
  
  for (const url of urlsToRemove) {
    const urlKey = IMAGE_CACHE.URL_PREFIX + url
    localStorage.removeItem(urlKey)
  }
  
  localStorage.setItem(IMAGE_CACHE.URL_LIST_KEY, JSON.stringify(updatedUrlList))
}

/**
 * 获取所有缓存的图片
 */
export function getCachedImages(): string[] {
  const urlList = getUrlList()
  
  return urlList
    .map(url => {
      const urlKey = IMAGE_CACHE.URL_PREFIX + url
      return localStorage.getItem(urlKey)
    })
    .filter(isNonNullString)
}

/**
 * 根据 URL 获取缓存的图片
 */
export function getCachedImageByUrl(url: string): string | null {
  const urlKey = IMAGE_CACHE.URL_PREFIX + url
  return localStorage.getItem(urlKey)
}

/**
 * 获取 URL 列表
 */
function getUrlList(): string[] {
  try {
    const listData = localStorage.getItem(IMAGE_CACHE.URL_LIST_KEY)
    return listData ? JSON.parse(listData) : []
  } catch {
    return []
  }
}
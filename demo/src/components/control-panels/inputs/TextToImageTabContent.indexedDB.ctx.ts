/**
 * IndexedDB 图片缓存工具类
 */

import { IMAGE_CACHE, INDEXED_DB } from './TextToImageTabContent.constants'
import { isIDBOpenDBRequest, isIDBDatabase } from './TextToImageTabContent.indexedDB.guard'

// 数据库实例
let db: IDBDatabase | null = null

/**
 * 初始化 IndexedDB 数据库
 */
async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(INDEXED_DB.DB_NAME, INDEXED_DB.DB_VERSION)

    request.onerror = (): void => {
      reject(new Error(INDEXED_DB.ERROR_MESSAGES.FAILED_TO_OPEN))
    }

    request.onsuccess = (): void => {
      if (!isIDBDatabase(request.result)) {
        reject(new Error(INDEXED_DB.ERROR_MESSAGES.FAILED_TO_OPEN))
        return
      }
      db = request.result
      resolve(db)
    }

    request.onupgradeneeded = (event): void => {
      if (!isIDBOpenDBRequest(event.target)) {
        reject(new Error(INDEXED_DB.ERROR_MESSAGES.FAILED_TO_OPEN))
        return
      }
      
      const database = request.result

      // 创建图片缓存存储
      if (!database.objectStoreNames.contains(INDEXED_DB.STORE_NAME)) {
        database.createObjectStore(INDEXED_DB.STORE_NAME, { keyPath: INDEXED_DB.KEY_PATH.URL })
      }

      // 创建 URL 列表存储
      if (!database.objectStoreNames.contains(INDEXED_DB.URL_LIST_STORE_NAME)) {
        database.createObjectStore(INDEXED_DB.URL_LIST_STORE_NAME, { keyPath: INDEXED_DB.KEY_PATH.ID })
      }
    }
  })
}

/**
 * 获取数据库实例
 */
async function getDB(): Promise<IDBDatabase> {
  if (db) {
    return db
  }
  return initDB()
}

/**
 * 缓存图片到 IndexedDB
 */
export async function cacheImage(base64: string, url: string): Promise<void> {
  if (!url) {
    return
  }

  try {
    // 先获取 URL 列表，避免在事务中创建新事务
    const urlList = await getUrlList()
    const database = await getDB()
    
    // 创建事务
    const transaction = database.transaction([INDEXED_DB.STORE_NAME, INDEXED_DB.URL_LIST_STORE_NAME], INDEXED_DB.TRANSACTION_MODE.READWRITE)
    
    // 缓存图片数据
    const imageStore = transaction.objectStore(INDEXED_DB.STORE_NAME)
    await new Promise<void>((resolve, reject) => {
      const request = imageStore.put({ url, base64, timestamp: Date.now() })
      request.onsuccess = (): void => resolve()
      request.onerror = (): void => reject(request.error)
    })

    // 更新 URL 列表
    const urlListStore = transaction.objectStore(INDEXED_DB.URL_LIST_STORE_NAME)
    if (!urlList.includes(url)) {
      const updatedUrlList = [...urlList, url]
      await new Promise<void>((resolve, reject) => {
        const request = urlListStore.put({ id: INDEXED_DB.URL_LIST_ID, urls: updatedUrlList })
        request.onsuccess = (): void => resolve()
        request.onerror = (): void => reject(request.error)
      })
    }

    // 等待事务完成后再清理旧缓存
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = (): void => resolve()
      transaction.onerror = (): void => reject(transaction.error)
    })

    await cleanupOldCache()
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
  
  // 移除超出限制的最旧的 URL
  const urlsToRemove = urlList.slice(0, urlList.length - IMAGE_CACHE.MAX_COUNT)
  const updatedUrlList = urlList.slice(urlList.length - IMAGE_CACHE.MAX_COUNT)
  
  const database = await getDB()
  const transaction = database.transaction([INDEXED_DB.STORE_NAME, INDEXED_DB.URL_LIST_STORE_NAME], INDEXED_DB.TRANSACTION_MODE.READWRITE)
  
  // 删除旧图片
  const imageStore = transaction.objectStore(INDEXED_DB.STORE_NAME)
  for (const url of urlsToRemove) {
    await new Promise<void>((resolve, reject) => {
      const request = imageStore.delete(url)
      request.onsuccess = (): void => resolve()
      request.onerror = (): void => reject(request.error)
    })
  }
  
  // 更新 URL 列表
  const urlListStore = transaction.objectStore(INDEXED_DB.URL_LIST_STORE_NAME)
  await new Promise<void>((resolve, reject) => {
    const request = urlListStore.put({ id: INDEXED_DB.URL_LIST_ID, urls: updatedUrlList })
    request.onsuccess = (): void => resolve()
    request.onerror = (): void => reject(request.error)
  })
  
  // 等待事务完成
  await new Promise<void>((resolve, reject) => {
    transaction.oncomplete = (): void => resolve()
    transaction.onerror = (): void => reject(transaction.error)
  })
}

/**
 * 获取所有缓存的图片
 */
export async function getCachedImages(): Promise<string[]> {
  try {
    const urlList = await getUrlList()
    const database = await getDB()
    const transaction = database.transaction([INDEXED_DB.STORE_NAME], INDEXED_DB.TRANSACTION_MODE.READONLY)
    const imageStore = transaction.objectStore(INDEXED_DB.STORE_NAME)
    
    const images: string[] = []
    for (const url of urlList) {
      const base64 = await new Promise<string | null>((resolve, reject) => {
        const request = imageStore.get(url)
        request.onsuccess = (): void => resolve(request.result?.base64 || null)
        request.onerror = (): void => reject(request.error)
      })
      if (base64) {
        images.push(base64)
      }
    }
    
    return images
  } catch (error) {
    console.warn(INDEXED_DB.ERROR_MESSAGES.FAILED_TO_GET_IMAGES, error)
    return []
  }
}

/**
 * 根据 URL 获取缓存的图片
 */
export async function getCachedImageByUrl(url: string): Promise<string | null> {
  if (!url) {
    return null
  }

  try {
    const database = await getDB()
    const transaction = database.transaction([INDEXED_DB.STORE_NAME], INDEXED_DB.TRANSACTION_MODE.READONLY)
    const imageStore = transaction.objectStore(INDEXED_DB.STORE_NAME)
    
    return new Promise((resolve, reject) => {
      const request = imageStore.get(url)
      request.onsuccess = (): void => resolve(request.result?.base64 || null)
      request.onerror = (): void => reject(request.error)
    })
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
    const database = await getDB()
    const transaction = database.transaction([INDEXED_DB.URL_LIST_STORE_NAME], INDEXED_DB.TRANSACTION_MODE.READONLY)
    const urlListStore = transaction.objectStore(INDEXED_DB.URL_LIST_STORE_NAME)
    
    return new Promise((resolve, reject) => {
      const request = urlListStore.get(INDEXED_DB.URL_LIST_ID)
      request.onsuccess = (): void => resolve(request.result?.urls || [])
      request.onerror = (): void => reject(request.error)
    })
  } catch (error) {
    console.warn(INDEXED_DB.ERROR_MESSAGES.FAILED_TO_GET_URL_LIST, error)
    return []
  }
}

/**
 * 清空所有缓存
 */
export async function clearAllCache(): Promise<void> {
  try {
    const database = await getDB()
    const transaction = database.transaction([INDEXED_DB.STORE_NAME, INDEXED_DB.URL_LIST_STORE_NAME], INDEXED_DB.TRANSACTION_MODE.READWRITE)
    
    // 清空图片缓存
    const imageStore = transaction.objectStore(INDEXED_DB.STORE_NAME)
    await new Promise<void>((resolve, reject) => {
      const request = imageStore.clear()
      request.onsuccess = (): void => resolve()
      request.onerror = (): void => reject(request.error)
    })
    
    // 清空 URL 列表
    const urlListStore = transaction.objectStore(INDEXED_DB.URL_LIST_STORE_NAME)
    await new Promise<void>((resolve, reject) => {
      const request = urlListStore.clear()
      request.onsuccess = (): void => resolve()
      request.onerror = (): void => reject(request.error)
    })
  } catch (error) {
    console.warn(INDEXED_DB.ERROR_MESSAGES.FAILED_TO_CLEAR_CACHE, error)
  }
}
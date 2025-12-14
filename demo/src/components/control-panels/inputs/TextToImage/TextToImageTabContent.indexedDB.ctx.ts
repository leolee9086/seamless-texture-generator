/**
 * IndexedDB 图片缓存工具类 (Powered by IndexDBFS)
 */
import { IndexDBFS } from '../../../../infra/IndexDBFS.class'
import { IMAGE_CACHE, INDEXED_DB } from './TextToImageTabContent.constants'
import type { ImageCacheItem, UrlListMeta } from './TextToImageTabContent.indexedDB.types'

// 初始化 FS 实例
// 注意：这里我们使用统一的数据库，或者沿用之前常量定义的名称
const fs = new IndexDBFS(
  INDEXED_DB.DB_NAME,
  [INDEXED_DB.STORE_NAME, INDEXED_DB.URL_LIST_STORE_NAME],
  INDEXED_DB.DB_VERSION
)

/**
 * 缓存图片到 IndexedDB
 */
export async function cacheImage(base64: string, url: string): Promise<void> {
  if (!url) return

  try {
    // 写入图片数据
    const item: ImageCacheItem = { url, base64, timestamp: Date.now() }
    await fs.write(`${INDEXED_DB.STORE_NAME}/${url}`, item)

    // 更新 URL 列表 (MetaData)
    // 这是一个非原子操作，但在 FS 模拟层下这也是可接受的 trade-off
    const urlList = await getUrlList()

    if (!urlList.includes(url)) {
      const updatedUrlList = [...urlList, url]
      await saveUrlList(updatedUrlList)
    }

    // 清理旧缓存
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

  // 更新列表
  await saveUrlList(updatedUrlList)

  // 删除文件
  for (const url of urlsToRemove) {
    try {
      await fs.delete(`${INDEXED_DB.STORE_NAME}/${url}`)
    } catch (err) {
      console.warn(`Failed to delete cache ${url}`, err)
    }
  }
}

/**
 * 获取所有缓存的图片
 */
export async function getCachedImages(): Promise<string[]> {
  try {
    const urlList = await getUrlList()
    const images: string[] = []

    // 按顺序读取
    for (const url of urlList) {
      const base64 = await getCachedImageByUrl(url)
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
  if (!url) return null

  try {
    const item = await fs.read<ImageCacheItem>(`${INDEXED_DB.STORE_NAME}/${url}`)
    return item?.base64 || null
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
    const meta = await fs.read<UrlListMeta>(`${INDEXED_DB.URL_LIST_STORE_NAME}/${INDEXED_DB.URL_LIST_ID}`)
    return meta?.urls || []
  } catch (error) {
    console.warn(INDEXED_DB.ERROR_MESSAGES.FAILED_TO_GET_URL_LIST, error)
    return []
  }
}

async function saveUrlList(urls: string[]): Promise<void> {
  const meta: UrlListMeta = { id: INDEXED_DB.URL_LIST_ID, urls }
  await fs.write(`${INDEXED_DB.URL_LIST_STORE_NAME}/${INDEXED_DB.URL_LIST_ID}`, meta)
}

/**
 * 清空所有缓存
 */
export async function clearAllCache(): Promise<void> {
  try {
    await fs.clear(INDEXED_DB.STORE_NAME)
    await fs.clear(INDEXED_DB.URL_LIST_STORE_NAME)
  } catch (error) {
    console.warn(INDEXED_DB.ERROR_MESSAGES.FAILED_TO_CLEAR_CACHE, error)
  }
}

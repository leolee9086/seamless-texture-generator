/**
 * 图像画廊工具函数
 */

import { ref, watch, type Ref } from './imports'
import { getCachedImageByUrl } from './TextToImageTabContent.cache'
import { IMAGE_CACHE } from './TextToImageTabContent.constants'

/**
 * 创建缓存图像 URL 的响应式引用
 */
export function createCachedImageUrls(): Ref<string[]> {
  return ref<string[]>([])
}

/**
 * 异步加载缓存图片
 */
export async function loadCachedImages(
  imageUrls: string[],
  cachedImageUrls: Ref<string[]>
): Promise<void> {
  const urls = await Promise.all(
    imageUrls.map(async (url) => {
      try {
        // 直接使用传入的URL（代理URL）查询缓存
        // 因为缓存时使用的是代理URL作为key
        const cached = await getCachedImageByUrl(url)
        // 如果缓存不存在，返回空字符串，图像将无法显示
        // 这符合"图像只能在缓存成功之后显示"的要求
        return cached || ''
      } catch (error) {
        console.warn('Failed to load cached image:', error)
        return ''
      }
    })
  )
  cachedImageUrls.value = urls
}

/**
 * 设置图像 URL 变化的监听器
 */
export function setupImageUrlsWatcher(
  imageUrlsGetter: () => string[],
  cachedImageUrls: Ref<string[]>
): void {
  watch(
    imageUrlsGetter,
    (newUrls) => loadCachedImages(newUrls, cachedImageUrls),
    { immediate: true }
  )
}

/**
 * 处理图像点击事件
 */
export async function handleImageClick(
  imageUrl: string,
  onImageClick?: (imageUrl: string) => void
): Promise<void> {
  try {
    // 直接使用传入的URL（代理URL）查询缓存
    // 因为缓存时使用的是代理URL作为key
    const cachedImage = await getCachedImageByUrl(imageUrl)
    if (cachedImage) {
      onImageClick?.(cachedImage)
      return
    }

    throw new Error("图片没有正确缓存")
  } catch (error) {
    console.error('Failed to load image:', error)
    // 可以在这里添加用户友好的错误提示
  }
}

/**
 * 从代理URL中提取原始URL
 * 如果不是代理URL，则直接返回原URL
 */
export function extractOriginalUrl(url: string): string {
  // 检查是否是代理URL格式: /api/common-proxy?target=encodedUrl
  const proxyUrlPattern = /^(.+)\?target=(.+)$/
  const match = url.match(proxyUrlPattern)

  if (match) {
    try {
      // 解码URL参数
      return decodeURIComponent(match[2])
    } catch (error) {
      console.warn(IMAGE_CACHE.ERROR_MESSAGES.FAILED_TO_DECODE_PROXY_URL, error)
      return url
    }
  }

  return url
}
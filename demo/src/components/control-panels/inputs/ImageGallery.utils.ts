/**
 * 图像画廊工具函数
 */

import { ref, watch } from './imports'
import { getCachedImageByUrl } from './TextToImageTabContent.cache'
import type { Ref } from './imports'

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
  imageUrls: string[],
  cachedImageUrls: Ref<string[]>
): void {
  watch(
    () => imageUrls,
    () => loadCachedImages(imageUrls, cachedImageUrls),
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
    // 首先尝试从缓存中获取图片
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
import { watch, Ref } from 'vue'
import { loadImage, scaleImageToMaxResolution } from './imageLoader'
import { BLOB_MIME_TYPE_PNG, CANVAS_TO_BLOB_ERROR_MESSAGE } from './imageWatcher.constants'

/** Blob URL 生命周期管理：存储上一次创建的 Blob URL 以便释放 */
let previousBlobUrl: string | null = null

/**
 * 将 Canvas 转换为 Blob URL（替代 toDataURL 以提升性能）
 * @param canvas 要转换的 Canvas 元素
 * @returns Promise<string> Blob URL
 */
async function canvasToBlobUrl(canvas: HTMLCanvasElement): Promise<string> {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blobResult) => blobResult ? resolve(blobResult) : reject(new Error(CANVAS_TO_BLOB_ERROR_MESSAGE)),
      BLOB_MIME_TYPE_PNG
    )
  })
  return URL.createObjectURL(blob)
}

/**
 * 释放上一次的 Blob URL 以避免内存泄漏
 */
function releasePreviousBlobUrl(): void {
  if (previousBlobUrl) {
    URL.revokeObjectURL(previousBlobUrl)
    previousBlobUrl = null
  }
}

/**
 * 监听原始图像和最大分辨率的变化，更新显示的图像
 * @param rawOriginalImage 原始原始图像的响应式引用
 * @param maxResolution 最大分辨率的响应式引用
 * @param originalImage 处理后图像的响应式引用
 * @param onError 错误处理回调
 */
export function watchImageChanges(
  rawOriginalImage: Ref<string | null>,
  maxResolution: Ref<number>,
  originalImage: Ref<string | null>,
  onError?: (message: string) => void
): void {
  watch([rawOriginalImage, maxResolution], async ([newRaw, newMaxRes]: [string | null, number]) => {
    // 释放上一次的 Blob URL
    releasePreviousBlobUrl()

    if (!newRaw) {
      originalImage.value = null
      return
    }

    try {
      const img = await loadImage(newRaw)
      const scaledCanvas = scaleImageToMaxResolution(img, newMaxRes)
      
      // 使用 toBlob + createObjectURL 替代 toDataURL
      const blobUrl = await canvasToBlobUrl(scaledCanvas)
      previousBlobUrl = blobUrl
      originalImage.value = blobUrl
    } catch (error) {
      console.error('加载或缩放图像时出错:', error)
      const errorMessage = '加载图像失败'
      onError?.(errorMessage)
    }
  })
}
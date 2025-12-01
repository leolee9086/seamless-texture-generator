import { watch, Ref } from 'vue'
import { loadImage, scaleImageToMaxResolution } from './imageProcessing'

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
    if (!newRaw) {
      originalImage.value = null
      return
    }

    try {
      const img = await loadImage(newRaw)
      const scaledCanvas = scaleImageToMaxResolution(img, newMaxRes)
      originalImage.value = scaledCanvas.toDataURL()
    } catch (error) {
      console.error('加载或缩放图像时出错:', error)
      const errorMessage = '加载图像失败'
      onError?.(errorMessage)
    }
  })
}
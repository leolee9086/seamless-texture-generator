import { makeTileable } from '../../../src/lib/HistogramPreservingBlendMakeTileable'
import { scaleImageToMaxResolution } from './imageProcessing'
import { processImageWithLUTFile } from '@leolee9086/use-lut'

/**
 * 处理图像，使其可平铺
 * @param originalImage 原始图像URL
 * @param maxResolution 最大分辨率
 * @param borderSize 边界大小
 * @param onProcessingStart 处理开始回调
 * @param onProcessingEnd 处理结束回调
 * @param onError 错误回调
 * @returns 处理后的图像URL
 */
export async function processImageToTileable(
  originalImage: string,
  maxResolution: number,
  borderSize: number,
  onProcessingStart?: () => void,
  onProcessingEnd?: () => void,
  onError?: (message: string) => void,
  lutFile?: File | null,
  lutIntensity?: number
): Promise<string> {
  if (!originalImage) {
    throw new Error('原始图像不能为空')
  }

  onProcessingStart?.()

  try {
    // 创建图像元素
    const img = new Image()
    img.crossOrigin = 'anonymous'

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('图像加载失败'))
      img.src = originalImage
    })

    // 先缩放图像到最大分辨率
    const scaledCanvas = scaleImageToMaxResolution(img, maxResolution)

    // 获取缩放后的图像数据
    let imageData = scaledCanvas.getContext('2d')!.getImageData(0, 0, scaledCanvas.width, scaledCanvas.height)
    console.log(lutFile)
    // 如果有LUT文件，先应用LUT
    if (lutFile) {
      try {
        // 使用LUT库处理图像 - 直接传递原始图像URL和LUT文件
        const lutFileUrl = URL.createObjectURL(lutFile)
        
        // 使用LUT库处理图像
        const lutResult = await processImageWithLUTFile(
          originalImage, // 使用原始图像URL，而不是处理后的ImageData
          lutFileUrl,
          lutIntensity || 1.0
        )
        console.log(lutResult)
        if (lutResult.success && lutResult.result) {
          // 更新图像数据为LUT处理后的结果
          imageData = new ImageData(
            new Uint8ClampedArray(lutResult.result),
            imageData.width,
            imageData.height
          )
        }
        
        // 清理临时URL
        URL.revokeObjectURL(lutFileUrl)
      } catch (error) {
        console.warn('LUT处理失败，继续使用原始图像:', error)
        // LUT处理失败时继续使用原始图像数据
      }
    }

    // 处理图像（可平铺化）
    // 当 borderSize 为 0 时，不进行无缝化处理，直接返回原始图像数据
    const processedImageData = borderSize === 0 ? imageData : await makeTileable(imageData, borderSize, null)

    // 将处理后的图像数据转换为URL
    const processedCanvas = document.createElement('canvas')
    processedCanvas.width = processedImageData.width
    processedCanvas.height = processedImageData.height
    const processedCtx = processedCanvas.getContext('2d')!
    processedCtx.putImageData(processedImageData, 0, 0)

    return processedCanvas.toDataURL()
  } catch (error) {
    const errorMessage = `处理图像时出错: ${error instanceof Error ? error.message : '未知错误'}`
    onError?.(errorMessage)
    throw error
  } finally {
    onProcessingEnd?.()
  }
}
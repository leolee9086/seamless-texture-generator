/**
 * ImageData → Blob 转换器
 *
 * 将 ImageData 转换为 Blob 对象，用于文件导出
 */

import type { Converter, ImageDataCarrier, BlobCarrier, ConversionContext } from './imports'

/**
 * 默认 MIME 类型
 */
const DEFAULT_MIME_TYPE = 'image/png'

/**
 * 默认图像质量（用于 JPEG/WebP）
 */
const DEFAULT_QUALITY = 0.92

/**
 * 将 ImageData 绘制到 OffscreenCanvas
 *
 * @param imageData - 源 ImageData
 * @returns OffscreenCanvas 及其 2D 上下文
 */
function drawImageDataToOffscreenCanvas(
  imageData: ImageData
): { canvas: OffscreenCanvas; ctx: OffscreenCanvasRenderingContext2D } {
  const canvas = new OffscreenCanvas(imageData.width, imageData.height)
  const ctx = canvas.getContext('2d')

  if (ctx === null) {
    throw new Error('Failed to get 2D context from OffscreenCanvas')
  }

  ctx.putImageData(imageData, 0, 0)
  return { canvas, ctx }
}

/**
 * 从 OffscreenCanvas 生成 Blob
 *
 * @param canvas - OffscreenCanvas 元素
 * @param mimeType - MIME 类型
 * @param quality - 图像质量（0-1，仅用于 JPEG/WebP）
 * @returns Blob 对象
 */
async function canvasToBlob(
  canvas: OffscreenCanvas,
  mimeType: string,
  quality: number
): Promise<Blob> {
  // OffscreenCanvas 使用 convertToBlob 方法
  return canvas.convertToBlob({
    type: mimeType,
    quality
  })
}

/**
 * 将 ImageData 转换为 Blob
 *
 * @param carrier - ImageData 载体
 * @param context - 转换上下文
 * @returns Blob 载体
 */
async function convertImageDataToBlob(
  carrier: ImageDataCarrier,
  context: ConversionContext
): Promise<BlobCarrier> {
  const { imageData, width, height } = carrier.state
  const { factories } = context
  const mimeType = DEFAULT_MIME_TYPE
  const quality = DEFAULT_QUALITY

  // 将 ImageData 绘制到 OffscreenCanvas
  const { canvas } = drawImageDataToOffscreenCanvas(imageData)

  // 从 Canvas 生成 Blob
  const blob = await canvasToBlob(canvas, mimeType, quality)

  return factories.createBlobCarrier({
    blob,
    width,
    height,
    mimeType
  })
}

/**
 * ImageData → Blob 转换器
 *
 * 将 ImageData 像素数据转换为 Blob 对象
 * 涉及 Canvas 绘制和编码操作，开销为 medium
 */
export const imageDataToBlobConverter: Converter<'ImageData', 'Blob'> = {
  state: {
    sourceFormat: 'ImageData',
    targetFormat: 'Blob',
    metadata: {
      name: 'imageDataToBlob',
      description: 'Convert ImageData to Blob for file export',
      costLevel: 'medium',
      isAsync: true
    }
  },
  /** @简洁函数 这是转换器接口要求的委托函数 */
  convert: async (source, context) => {
    return convertImageDataToBlob(source, context)
  }
}

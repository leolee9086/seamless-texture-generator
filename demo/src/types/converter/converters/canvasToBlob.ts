/**
 * Canvas → Blob 转换器
 *
 * 将 Canvas 元素转换为 Blob 对象，用于文件导出
 * 支持 HTMLCanvasElement 和 OffscreenCanvas 两种输入类型
 */

import type { Converter, CanvasCarrier, BlobCarrier, ConversionContext } from './imports'

/**
 * 默认 MIME 类型
 */
const DEFAULT_MIME_TYPE = 'image/png'

/**
 * 默认图像质量（用于 JPEG/WebP）
 */
const DEFAULT_QUALITY = 0.92

/**
 * 将 HTMLCanvasElement 转换为 Blob
 *
 * 使用 toBlob 方法并包装为 Promise
 *
 * @param canvas - HTMLCanvasElement 元素
 * @param mimeType - MIME 类型
 * @param quality - 图像质量（0-1，仅用于 JPEG/WebP）
 * @returns Blob 对象
 */
function htmlCanvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob === null) {
          reject(new Error('HTMLCanvasElement.toBlob() returned null'))
          return
        }
        resolve(blob)
      },
      mimeType,
      quality
    )
  })
}

/**
 * 将 OffscreenCanvas 转换为 Blob
 *
 * 使用 convertToBlob 方法
 *
 * @param canvas - OffscreenCanvas 元素
 * @param mimeType - MIME 类型
 * @param quality - 图像质量（0-1，仅用于 JPEG/WebP）
 * @returns Blob 对象
 */
async function offscreenCanvasToBlob(
  canvas: OffscreenCanvas,
  mimeType: string,
  quality: number
): Promise<Blob> {
  return canvas.convertToBlob({
    type: mimeType,
    quality
  })
}

/**
 * 将 Canvas 转换为 Blob
 *
 * 根据 Canvas 类型自动选择合适的转换方法
 *
 * @param canvas - Canvas 元素（HTMLCanvasElement 或 OffscreenCanvas）
 * @param mimeType - MIME 类型
 * @param quality - 图像质量
 * @returns Blob 对象
 */
function canvasToBlob(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  mimeType: string,
  quality: number
): Promise<Blob> {
  return canvas instanceof HTMLCanvasElement
    ? htmlCanvasToBlob(canvas, mimeType, quality)
    : offscreenCanvasToBlob(canvas, mimeType, quality)
}

/**
 * 将 Canvas 载体转换为 Blob 载体
 *
 * @param carrier - Canvas 载体
 * @param context - 转换上下文
 * @returns Blob 载体
 */
async function convertCanvasToBlob(
  carrier: CanvasCarrier,
  context: ConversionContext
): Promise<BlobCarrier> {
  const { canvas, width, height } = carrier.state
  const { factories } = context
  const mimeType = DEFAULT_MIME_TYPE
  const quality = DEFAULT_QUALITY

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
 * Canvas → Blob 转换器
 *
 * 将 Canvas 元素转换为 Blob 对象
 * 涉及图像编码操作，开销为 medium
 */
export const canvasToBlobConverter: Converter<'Canvas', 'Blob'> = {
  state: {
    sourceFormat: 'Canvas',
    targetFormat: 'Blob',
    metadata: {
      name: 'canvasToBlob',
      description: 'Convert Canvas to Blob for file export',
      costLevel: 'medium',
      isAsync: true
    }
  },
  /** @简洁函数 这是转换器接口要求的委托函数 */
  convert: async (source, context) => {
    return convertCanvasToBlob(source, context)
  }
}

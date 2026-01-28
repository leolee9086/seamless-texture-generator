/**
 * Blob → ImageData 转换器
 *
 * 将 Blob 对象解码为 ImageData，用于图像处理
 */

import type { Converter, BlobCarrier, ImageDataCarrier, ConversionContext } from './imports'

/**
 * 从 ImageBitmap 创建 OffscreenCanvas 并获取 2D 上下文
 *
 * @param bitmap - ImageBitmap 对象
 * @returns OffscreenCanvas 及其 2D 上下文
 * @throws 如果无法获取上下文则抛出错误
 */
function createCanvasFromBitmap(
  bitmap: ImageBitmap
): { canvas: OffscreenCanvas; ctx: OffscreenCanvasRenderingContext2D } {
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
  const ctx = canvas.getContext('2d')

  if (ctx === null) {
    throw new Error('Failed to get 2D context from OffscreenCanvas')
  }

  return { canvas, ctx }
}

/**
 * 将 ImageBitmap 绘制到 Canvas 并提取 ImageData
 *
 * @param bitmap - ImageBitmap 对象
 * @returns ImageData 对象
 */
function extractImageDataFromBitmap(bitmap: ImageBitmap): ImageData {
  const { canvas, ctx } = createCanvasFromBitmap(bitmap)

  // 绘制 ImageBitmap 到 Canvas
  ctx.drawImage(bitmap, 0, 0)

  // 提取 ImageData
  return ctx.getImageData(0, 0, canvas.width, canvas.height)
}

/**
 * 将 Blob 解码为 ImageData
 *
 * @param carrier - Blob 载体
 * @param context - 转换上下文
 * @returns ImageData 载体
 */
async function convertBlobToImageData(
  carrier: BlobCarrier,
  context: ConversionContext
): Promise<ImageDataCarrier> {
  const { blob } = carrier.state
  const { factories } = context

  // 使用 createImageBitmap 解码 Blob
  const bitmap = await createImageBitmap(blob)

  try {
    // 从 ImageBitmap 提取 ImageData
    const imageData = extractImageDataFromBitmap(bitmap)
    return factories.createImageDataCarrier(imageData)
  } finally {
    // 释放 ImageBitmap 资源
    bitmap.close()
  }
}

/**
 * Blob → ImageData 转换器
 *
 * 将 Blob 对象解码为 ImageData 像素数据
 * 涉及图像解码操作，开销为 high
 */
export const blobToImageDataConverter: Converter<'Blob', 'ImageData'> = {
  state: {
    sourceFormat: 'Blob',
    targetFormat: 'ImageData',
    metadata: {
      name: 'blobToImageData',
      description: 'Decode Blob to ImageData for image processing',
      costLevel: 'high',
      isAsync: true
    }
  },
  /** @简洁函数 这是转换器接口要求的委托函数 */
  convert: async (source, context) => {
    return convertBlobToImageData(source, context)
  }
}

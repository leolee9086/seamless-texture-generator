/**
 * ImageData → Canvas 转换器
 *
 * 将 ImageData 绘制到 Canvas 元素
 */

import type { Converter, ImageDataCarrier, CanvasCarrier, ConversionContext } from './imports'

/**
 * 将 ImageData 绘制到新的 Canvas
 *
 * @param carrier - ImageData 载体
 * @param context - 转换上下文
 * @returns Canvas 载体
 */
function drawImageDataToCanvas(
  carrier: ImageDataCarrier,
  context: ConversionContext
): CanvasCarrier {
  const { imageData, width, height } = carrier.state
  const { factories } = context

  // 创建 OffscreenCanvas 以获得更好的性能
  const canvas = new OffscreenCanvas(width, height)
  const ctx = canvas.getContext('2d')

  if (ctx === null) {
    throw new Error('Failed to get 2D context from OffscreenCanvas')
  }

  // 绘制 ImageData 到 Canvas
  ctx.putImageData(imageData, 0, 0)

  return factories.createCanvasCarrier(canvas, ctx)
}

/**
 * ImageData → Canvas 转换器
 *
 * 将 ImageData 像素数据绘制到 Canvas 元素
 * 纯 CPU 内存操作，开销为 low
 */
export const imageDataToCanvasConverter: Converter<'ImageData', 'Canvas'> = {
  state: {
    sourceFormat: 'ImageData',
    targetFormat: 'Canvas',
    metadata: {
      name: 'imageDataToCanvas',
      description: 'Draw ImageData to Canvas element',
      costLevel: 'low',
      isAsync: false
    }
  },
  /** @简洁函数 这是转换器接口要求的委托函数 */
  convert: async (source, context) => {
    return drawImageDataToCanvas(source, context)
  }
}

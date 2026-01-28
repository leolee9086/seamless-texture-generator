/**
 * Canvas → ImageData 转换器
 *
 * 从 Canvas 元素提取 ImageData
 */

import type { Converter, CanvasCarrier, ImageDataCarrier, ConversionContext } from './imports'

/**
 * 从 HTMLCanvasElement 获取 2D 上下文
 *
 * @param canvas - HTMLCanvasElement 元素
 * @returns 2D 渲染上下文
 * @throws 如果无法获取上下文则抛出错误
 */
function getHTMLCanvas2DContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d')
  if (ctx === null) {
    throw new Error('Failed to get 2D context from HTMLCanvasElement')
  }
  return ctx
}

/**
 * 从 OffscreenCanvas 获取 2D 上下文
 *
 * @param canvas - OffscreenCanvas 元素
 * @returns 2D 渲染上下文
 * @throws 如果无法获取上下文则抛出错误
 */
function getOffscreenCanvas2DContext(canvas: OffscreenCanvas): OffscreenCanvasRenderingContext2D {
  const ctx = canvas.getContext('2d')
  if (ctx === null) {
    throw new Error('Failed to get 2D context from OffscreenCanvas')
  }
  return ctx
}

/**
 * 获取 Canvas 的 2D 上下文
 *
 * @param canvas - Canvas 元素
 * @returns 2D 渲染上下文
 */
function getCanvas2DContext(
  canvas: HTMLCanvasElement | OffscreenCanvas
): CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D {
  return canvas instanceof HTMLCanvasElement
    ? getHTMLCanvas2DContext(canvas)
    : getOffscreenCanvas2DContext(canvas)
}

/**
 * 从 Canvas 提取 ImageData
 *
 * @param carrier - Canvas 载体
 * @param context - 转换上下文
 * @returns ImageData 载体
 */
function extractImageDataFromCanvas(
  carrier: CanvasCarrier,
  context: ConversionContext
): ImageDataCarrier {
  const { canvas, context: canvasContext, width, height } = carrier.state
  const { factories } = context

  // 优先使用已有的 context，否则创建新的
  const ctx = canvasContext ?? getCanvas2DContext(canvas)

  // 提取 ImageData
  const imageData = ctx.getImageData(0, 0, width, height)
  return factories.createImageDataCarrier(imageData)
}

/**
 * Canvas → ImageData 转换器
 *
 * 从 Canvas 元素提取像素数据到 ImageData
 * 纯 CPU 内存操作，开销为 low
 */
export const canvasToImageDataConverter: Converter<'Canvas', 'ImageData'> = {
  state: {
    sourceFormat: 'Canvas',
    targetFormat: 'ImageData',
    metadata: {
      name: 'canvasToImageData',
      description: 'Extract ImageData from Canvas element',
      costLevel: 'low',
      isAsync: false
    }
  },
  /** @简洁函数 这是转换器接口要求的委托函数 */
  convert: async (source, context) => {
    return extractImageDataFromCanvas(source, context)
  }
}

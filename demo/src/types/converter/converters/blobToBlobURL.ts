/**
 * Blob → BlobURL 转换器
 *
 * 将 Blob 对象转换为 Blob URL，用于图像显示和下载
 */

import type { Converter, BlobCarrier, BlobURLCarrier, ConversionContext } from './imports'

/**
 * 将 Blob 转换为 Blob URL
 *
 * @param carrier - Blob 载体
 * @param context - 转换上下文
 * @returns BlobURL 载体
 */
function convertBlobToBlobURL(
  carrier: BlobCarrier,
  context: ConversionContext
): BlobURLCarrier {
  const { blob, width, height, mimeType } = carrier.state
  const { factories } = context

  // 使用 URL.createObjectURL 创建 Blob URL
  const url = URL.createObjectURL(blob)

  return factories.createBlobURLCarrier({
    url,
    width,
    height,
    mimeType
  })
}

/**
 * Blob → BlobURL 转换器
 *
 * 将 Blob 对象转换为 Blob URL 字符串
 * 仅创建 URL 引用，开销为 trivial
 *
 * 注意：BlobURL 的 destroy() 方法会调用 URL.revokeObjectURL() 释放资源
 */
export const blobToBlobURLConverter: Converter<'Blob', 'BlobURL'> = {
  state: {
    sourceFormat: 'Blob',
    targetFormat: 'BlobURL',
    metadata: {
      name: 'blobToBlobURL',
      description: 'Create Blob URL from Blob for display and download',
      costLevel: 'trivial',
      isAsync: false
    }
  },
  /** @简洁函数 这是转换器接口要求的委托函数 */
  convert: async (source, context) => {
    return convertBlobToBlobURL(source, context)
  }
}

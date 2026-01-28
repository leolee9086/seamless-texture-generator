/**
 * ImageData → GPUBuffer 转换器
 *
 * 将 CPU 端的 ImageData 上传到 GPU 缓冲区
 */

import type { Converter, ImageDataCarrier, GPUBufferCarrier, ConversionContext } from './imports'

/**
 * 将 ImageData 上传到 GPUBuffer
 *
 * @param carrier - ImageData 载体
 * @param context - 转换上下文
 * @returns GPUBuffer 载体
 */
async function uploadImageDataToGPUBuffer(
  carrier: ImageDataCarrier,
  context: ConversionContext
): Promise<GPUBufferCarrier> {
  const { imageData, width, height } = carrier.state
  const { device, factories } = context
  const size = width * height * 4

  // 创建 GPU 缓冲区
  const buffer = device.createBuffer({
    size,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true
  })

  // 写入数据
  const mappedRange = buffer.getMappedRange()
  new Uint8Array(mappedRange).set(imageData.data)
  buffer.unmap()

  return factories.createGPUBufferCarrier({
    buffer,
    width,
    height,
    bytesPerPixel: 4
  })
}

/**
 * ImageData → GPUBuffer 转换器
 *
 * 将 CPU 端的 ImageData 像素数据上传到 GPU 缓冲区
 * 涉及 CPU→GPU 数据传输，开销为 medium
 */
export const imageDataToGPUBufferConverter: Converter<'ImageData', 'GPUBuffer'> = {
  state: {
    sourceFormat: 'ImageData',
    targetFormat: 'GPUBuffer',
    metadata: {
      name: 'imageDataToGPUBuffer',
      description: 'Upload ImageData to GPUBuffer',
      costLevel: 'medium',
      isAsync: true
    }
  },
  /** @简洁函数 这是转换器接口要求的委托函数 */
  convert: async (source, context) => {
    return uploadImageDataToGPUBuffer(source, context)
  }
}

/**
 * GPUBuffer → ImageData 转换器
 *
 * 将 GPU 缓冲区数据转换为 CPU 端的 ImageData
 */

import type { Converter, GPUBufferCarrier, ImageDataCarrier, ConversionContext } from './imports'

/**
 * 从 GPUBuffer 读取数据到 ImageData
 *
 * @param carrier - GPUBuffer 载体
 * @param device - WebGPU 设备
 * @returns ImageData 载体
 */
async function readGPUBufferToImageData(
  carrier: GPUBufferCarrier,
  context: ConversionContext
): Promise<ImageDataCarrier> {
  const { buffer, width, height } = carrier.state
  const { device, factories } = context
  const size = width * height * 4

  // 创建用于读取的暂存缓冲区
  const stagingBuffer = device.createBuffer({
    size,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
  })

  // 复制数据到暂存缓冲区
  const commandEncoder = device.createCommandEncoder()
  commandEncoder.copyBufferToBuffer(buffer, 0, stagingBuffer, 0, size)
  device.queue.submit([commandEncoder.finish()])

  // 映射并读取数据
  await stagingBuffer.mapAsync(GPUMapMode.READ)
  const copyArrayBuffer = stagingBuffer.getMappedRange()
  const data = new Uint8ClampedArray(copyArrayBuffer.slice(0))
  stagingBuffer.unmap()
  stagingBuffer.destroy()

  // 创建 ImageData 并返回载体
  const imageData = new ImageData(data, width, height)
  return factories.createImageDataCarrier(imageData)
}

/**
 * GPUBuffer → ImageData 转换器
 *
 * 将 GPU 缓冲区中的像素数据读取到 CPU 端的 ImageData
 * 涉及 GPU→CPU 数据传输，开销为 medium
 */
export const gpuBufferToImageDataConverter: Converter<'GPUBuffer', 'ImageData'> = {
  state: {
    sourceFormat: 'GPUBuffer',
    targetFormat: 'ImageData',
    metadata: {
      name: 'gpuBufferToImageData',
      description: 'Convert GPUBuffer to ImageData via staging buffer',
      costLevel: 'medium',
      isAsync: true
    }
  },
  /** @简洁函数 这是转换器接口要求的委托函数 */
  convert: async (source, context) => {
    return readGPUBufferToImageData(source, context)
  }
}

/**
 * GPUTexture → ImageData 转换器
 *
 * 将 GPU 纹理数据读取到 CPU 端的 ImageData
 * 通过创建临时 GPUBuffer 并使用 copyTextureToBuffer 实现数据传输
 */

import type { Converter, GPUTextureCarrier, ImageDataCarrier, ConversionContext } from './imports'

/**
 * 计算纹理行对齐后的字节数
 * WebGPU 要求 bytesPerRow 必须是 256 的倍数
 *
 * @param width - 纹理宽度（像素）
 * @param bytesPerPixel - 每像素字节数
 * @returns 对齐后的每行字节数
 */
function calculateAlignedBytesPerRow(width: number, bytesPerPixel: number): number {
  const COPY_BYTES_PER_ROW_ALIGNMENT = 256
  const unalignedBytesPerRow = width * bytesPerPixel
  return Math.ceil(unalignedBytesPerRow / COPY_BYTES_PER_ROW_ALIGNMENT) * COPY_BYTES_PER_ROW_ALIGNMENT
}

/**
 * 从 GPUTexture 读取像素数据到 ImageData
 *
 * @param carrier - GPUTexture 载体
 * @param context - 转换上下文
 * @returns ImageData 载体
 */
async function readGPUTextureToImageData(
  carrier: GPUTextureCarrier,
  context: ConversionContext
): Promise<ImageDataCarrier> {
  const { texture, width, height } = carrier.state
  const { device, factories } = context
  const bytesPerPixel = 4 // RGBA8 格式
  const alignedBytesPerRow = calculateAlignedBytesPerRow(width, bytesPerPixel)
  const bufferSize = alignedBytesPerRow * height

  // 创建用于读取的暂存缓冲区
  const stagingBuffer = device.createBuffer({
    size: bufferSize,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
  })

  // 使用 commandEncoder 将纹理数据复制到缓冲区
  const commandEncoder = device.createCommandEncoder()
  commandEncoder.copyTextureToBuffer(
    { texture },
    {
      buffer: stagingBuffer,
      bytesPerRow: alignedBytesPerRow,
      rowsPerImage: height
    },
    { width, height, depthOrArrayLayers: 1 }
  )
  device.queue.submit([commandEncoder.finish()])

  // 映射缓冲区并读取数据
  await stagingBuffer.mapAsync(GPUMapMode.READ)
  const mappedRange = stagingBuffer.getMappedRange()

  // 处理行对齐：如果有填充字节，需要逐行复制
  const actualBytesPerRow = width * bytesPerPixel
  const data = new Uint8ClampedArray(width * height * bytesPerPixel)
  const sourceData = new Uint8ClampedArray(mappedRange)

  // 无填充时直接复制
  if (alignedBytesPerRow === actualBytesPerRow) {
    data.set(sourceData)
    stagingBuffer.unmap()
    stagingBuffer.destroy()
    const imageData = new ImageData(data, width, height)
    return factories.createImageDataCarrier(imageData)
  }

  // 有填充时逐行复制以去除填充字节
  for (let row = 0; row < height; row++) {
    const sourceOffset = row * alignedBytesPerRow
    const destOffset = row * actualBytesPerRow
    data.set(
      sourceData.subarray(sourceOffset, sourceOffset + actualBytesPerRow),
      destOffset
    )
  }

  // 清理资源
  stagingBuffer.unmap()
  stagingBuffer.destroy()

  // 创建 ImageData 并返回载体
  const imageData = new ImageData(data, width, height)
  return factories.createImageDataCarrier(imageData)
}

/**
 * GPUTexture → ImageData 转换器
 *
 * 将 GPU 纹理中的像素数据读取到 CPU 端的 ImageData
 * 涉及 GPU→CPU 数据传输，开销为 medium
 *
 * 实现细节：
 * - 创建临时 GPUBuffer 作为暂存区
 * - 使用 copyTextureToBuffer 复制纹理数据
 * - 处理 WebGPU 的 256 字节行对齐要求
 * - 映射缓冲区读取数据后创建 ImageData
 */
export const gpuTextureToImageDataConverter: Converter<'GPUTexture', 'ImageData'> = {
  state: {
    sourceFormat: 'GPUTexture',
    targetFormat: 'ImageData',
    metadata: {
      name: 'gpuTextureToImageData',
      description: 'Read GPUTexture to ImageData via staging buffer',
      costLevel: 'medium',
      isAsync: true
    }
  },
  /** @简洁函数 这是转换器接口要求的委托函数 */
  convert: async (source, context) => {
    return readGPUTextureToImageData(source, context)
  }
}

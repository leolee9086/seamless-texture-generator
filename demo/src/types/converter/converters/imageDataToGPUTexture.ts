/**
 * ImageData → GPUTexture 转换器
 *
 * 将 CPU 端的 ImageData 上传到 GPU 纹理
 * 使用 device.queue.writeTexture() 实现数据传输
 */

import type { Converter, ImageDataCarrier, GPUTextureCarrier, ConversionContext } from './imports'

/**
 * 默认纹理格式
 * 使用 rgba8unorm 格式，与 ImageData 的 RGBA 格式兼容
 */
const DEFAULT_TEXTURE_FORMAT: GPUTextureFormat = 'rgba8unorm'

/**
 * 默认纹理用途标志
 * 包含常用的纹理操作权限
 */
const DEFAULT_TEXTURE_USAGE: GPUTextureUsageFlags =
  GPUTextureUsage.TEXTURE_BINDING |
  GPUTextureUsage.COPY_SRC |
  GPUTextureUsage.COPY_DST |
  GPUTextureUsage.RENDER_ATTACHMENT

/**
 * 将 ImageData 上传到 GPUTexture
 *
 * @param carrier - ImageData 载体
 * @param context - 转换上下文
 * @returns GPUTexture 载体
 */
async function uploadImageDataToGPUTexture(
  carrier: ImageDataCarrier,
  context: ConversionContext
): Promise<GPUTextureCarrier> {
  const { imageData, width, height } = carrier.state
  const { device, factories } = context
  const bytesPerPixel = 4 // RGBA8 格式

  // 创建 GPU 纹理
  const texture = device.createTexture({
    size: { width, height, depthOrArrayLayers: 1 },
    format: DEFAULT_TEXTURE_FORMAT,
    usage: DEFAULT_TEXTURE_USAGE
  })

  // 使用 writeTexture 将 ImageData 数据写入纹理
  device.queue.writeTexture(
    { texture },
    imageData.data,
    {
      bytesPerRow: width * bytesPerPixel,
      rowsPerImage: height
    },
    { width, height, depthOrArrayLayers: 1 }
  )

  return factories.createGPUTextureCarrier({
    texture,
    width,
    height,
    textureFormat: DEFAULT_TEXTURE_FORMAT,
    usage: DEFAULT_TEXTURE_USAGE
  })
}

/**
 * ImageData → GPUTexture 转换器
 *
 * 将 CPU 端的 ImageData 像素数据上传到 GPU 纹理
 * 涉及 CPU→GPU 数据传输，开销为 medium
 *
 * 实现细节：
 * - 创建 rgba8unorm 格式的 GPUTexture
 * - 使用 device.queue.writeTexture() 直接写入数据
 * - 纹理包含 TEXTURE_BINDING、COPY_SRC、COPY_DST、RENDER_ATTACHMENT 用途
 */
export const imageDataToGPUTextureConverter: Converter<'ImageData', 'GPUTexture'> = {
  state: {
    sourceFormat: 'ImageData',
    targetFormat: 'GPUTexture',
    metadata: {
      name: 'imageDataToGPUTexture',
      description: 'Upload ImageData to GPUTexture',
      costLevel: 'medium',
      isAsync: true
    }
  },
  /** @简洁函数 这是转换器接口要求的委托函数 */
  convert: async (source, context) => {
    return uploadImageDataToGPUTexture(source, context)
  }
}

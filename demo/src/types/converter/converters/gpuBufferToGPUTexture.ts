/**
 * GPUBuffer → GPUTexture 转换器
 *
 * 将 GPU 缓冲区数据复制到 GPU 纹理
 * 使用 commandEncoder.copyBufferToTexture() 实现 GPU 内部数据传输
 */

import type { Converter, GPUBufferCarrier, GPUTextureCarrier, ConversionContext } from './imports'

/**
 * 默认纹理格式
 * 使用 rgba8unorm 格式，与 RGBA 像素数据兼容
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
 * WebGPU 行对齐常量
 * bytesPerRow 必须是 256 的倍数
 */
const COPY_BYTES_PER_ROW_ALIGNMENT = 256

/**
 * RGBA 格式每像素字节数
 */
const BYTES_PER_PIXEL = 4

/**
 * GPU 复制操作上下文
 * 用于在多个复制相关函数之间共享状态
 */
interface GPUCopyContext {
  /** WebGPU 设备 */
  device: GPUDevice
  /** 源 GPUBuffer */
  sourceBuffer: GPUBuffer
  /** 目标 GPUTexture */
  targetTexture: GPUTexture
  /** 图像宽度 */
  width: number
  /** 图像高度 */
  height: number
  /** 对齐后的每行字节数 */
  alignedBytesPerRow: number
  /** 实际每行字节数（无填充） */
  actualBytesPerRow: number
}

/**
 * 计算纹理行对齐后的字节数
 * WebGPU 要求 bytesPerRow 必须是 256 的倍数
 *
 * @简洁函数 这是一个纯计算工具函数
 * @param width - 纹理宽度（像素）
 * @returns 对齐后的每行字节数
 */
function calculateAlignedBytesPerRow(width: number): number {
  const unalignedBytesPerRow = width * BYTES_PER_PIXEL
  return Math.ceil(unalignedBytesPerRow / COPY_BYTES_PER_ROW_ALIGNMENT) * COPY_BYTES_PER_ROW_ALIGNMENT
}

/**
 * 执行直接的 Buffer 到 Texture 复制
 * 用于源缓冲区已经是对齐格式的情况
 *
 * @param ctx - GPU 复制操作上下文
 */
function executeDirectCopy(ctx: GPUCopyContext): void {
  const commandEncoder = ctx.device.createCommandEncoder()
  commandEncoder.copyBufferToTexture(
    {
      buffer: ctx.sourceBuffer,
      bytesPerRow: ctx.alignedBytesPerRow,
      rowsPerImage: ctx.height
    },
    { texture: ctx.targetTexture },
    { width: ctx.width, height: ctx.height, depthOrArrayLayers: 1 }
  )
  ctx.device.queue.submit([commandEncoder.finish()])
}

/**
 * 从紧凑格式缓冲区读取数据到 Uint8Array
 *
 * @param ctx - GPU 复制操作上下文
 * @returns 读取的数据
 */
async function readCompactBufferData(ctx: GPUCopyContext): Promise<Uint8Array> {
  const compactSize = ctx.actualBytesPerRow * ctx.height

  const stagingReadBuffer = ctx.device.createBuffer({
    size: compactSize,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
  })

  const readEncoder = ctx.device.createCommandEncoder()
  readEncoder.copyBufferToBuffer(ctx.sourceBuffer, 0, stagingReadBuffer, 0, compactSize)
  ctx.device.queue.submit([readEncoder.finish()])

  await stagingReadBuffer.mapAsync(GPUMapMode.READ)
  const mappedRange = stagingReadBuffer.getMappedRange()
  const data = new Uint8Array(mappedRange.slice(0))
  stagingReadBuffer.unmap()
  stagingReadBuffer.destroy()

  return data
}

/**
 * 创建对齐的中间缓冲区并填充数据
 *
 * @param ctx - GPU 复制操作上下文
 * @param sourceData - 源数据（紧凑格式）
 * @returns 创建的对齐缓冲区
 */
function createAlignedBuffer(ctx: GPUCopyContext, sourceData: Uint8Array): GPUBuffer {
  const alignedSize = ctx.alignedBytesPerRow * ctx.height

  const alignedBuffer = ctx.device.createBuffer({
    size: alignedSize,
    usage: GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true
  })

  const alignedData = new Uint8Array(alignedBuffer.getMappedRange())

  // 逐行复制数据，添加填充
  for (let row = 0; row < ctx.height; row++) {
    const sourceOffset = row * ctx.actualBytesPerRow
    const destOffset = row * ctx.alignedBytesPerRow
    alignedData.set(
      sourceData.subarray(sourceOffset, sourceOffset + ctx.actualBytesPerRow),
      destOffset
    )
  }

  alignedBuffer.unmap()
  return alignedBuffer
}

/**
 * 通过对齐的中间缓冲区执行复制
 * 用于源缓冲区是紧凑格式的情况
 *
 * @param ctx - GPU 复制操作上下文
 */
async function executeCopyViaAlignedBuffer(ctx: GPUCopyContext): Promise<void> {
  // 读取源缓冲区数据
  const sourceData = await readCompactBufferData(ctx)

  // 创建对齐的中间缓冲区
  const alignedBuffer = createAlignedBuffer(ctx, sourceData)

  // 创建使用对齐缓冲区的新上下文
  const alignedCtx: GPUCopyContext = {
    ...ctx,
    sourceBuffer: alignedBuffer
  }

  // 从对齐缓冲区复制到纹理
  executeDirectCopy(alignedCtx)

  // 清理中间缓冲区
  alignedBuffer.destroy()
}

/**
 * 将 GPUBuffer 数据复制到 GPUTexture
 *
 * @param carrier - GPUBuffer 载体
 * @param context - 转换上下文
 * @returns GPUTexture 载体
 */
async function copyGPUBufferToGPUTexture(
  carrier: GPUBufferCarrier,
  context: ConversionContext
): Promise<GPUTextureCarrier> {
  const { buffer, width, height } = carrier.state
  const { device, factories } = context
  const alignedBytesPerRow = calculateAlignedBytesPerRow(width)
  const actualBytesPerRow = width * BYTES_PER_PIXEL

  // 创建目标纹理
  const texture = device.createTexture({
    size: { width, height, depthOrArrayLayers: 1 },
    format: DEFAULT_TEXTURE_FORMAT,
    usage: DEFAULT_TEXTURE_USAGE
  })

  // 构建复制上下文
  const ctx: GPUCopyContext = {
    device,
    sourceBuffer: buffer,
    targetTexture: texture,
    width,
    height,
    alignedBytesPerRow,
    actualBytesPerRow
  }

  // 判断源缓冲区格式
  const expectedAlignedSize = alignedBytesPerRow * height
  const isSourceAligned = buffer.size >= expectedAlignedSize

  // 源缓冲区已对齐，直接复制
  if (isSourceAligned) {
    executeDirectCopy(ctx)
    return factories.createGPUTextureCarrier({
      texture,
      width,
      height,
      textureFormat: DEFAULT_TEXTURE_FORMAT,
      usage: DEFAULT_TEXTURE_USAGE
    })
  }

  // 源缓冲区是紧凑格式，需要通过中间缓冲区复制
  await executeCopyViaAlignedBuffer(ctx)

  return factories.createGPUTextureCarrier({
    texture,
    width,
    height,
    textureFormat: DEFAULT_TEXTURE_FORMAT,
    usage: DEFAULT_TEXTURE_USAGE
  })
}

/**
 * GPUBuffer → GPUTexture 转换器
 *
 * 将 GPU 缓冲区中的像素数据复制到 GPU 纹理
 * 完全在 GPU 内部完成，开销为 low
 *
 * 实现细节：
 * - 创建 rgba8unorm 格式的 GPUTexture
 * - 使用 commandEncoder.copyBufferToTexture() 复制数据
 * - 处理 WebGPU 的 256 字节行对齐要求
 * - 对于紧凑格式的源缓冲区，创建对齐的中间缓冲区
 */
export const gpuBufferToGPUTextureConverter: Converter<'GPUBuffer', 'GPUTexture'> = {
  state: {
    sourceFormat: 'GPUBuffer',
    targetFormat: 'GPUTexture',
    metadata: {
      name: 'gpuBufferToGPUTexture',
      description: 'Copy GPUBuffer to GPUTexture via GPU internal transfer',
      costLevel: 'low',
      isAsync: true
    }
  },
  /** @简洁函数 这是转换器接口要求的委托函数 */
  convert: async (source, context) => {
    return copyGPUBufferToGPUTexture(source, context)
  }
}

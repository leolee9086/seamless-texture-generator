/**
 * GPUTexture → GPUBuffer 转换器
 *
 * 将 GPU 纹理数据复制到 GPU 缓冲区
 * 使用 commandEncoder.copyTextureToBuffer() 实现 GPU 内部数据传输
 */

import type { Converter, GPUTextureCarrier, GPUBufferCarrier, ConversionContext } from './imports'

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
 * 默认缓冲区用途标志
 * 包含常用的缓冲区操作权限
 */
const DEFAULT_BUFFER_USAGE: GPUBufferUsageFlags =
  GPUBufferUsage.STORAGE |
  GPUBufferUsage.COPY_SRC |
  GPUBufferUsage.COPY_DST

/**
 * GPU 纹理到缓冲区复制上下文
 * 用于在多个复制相关函数之间共享状态
 */
interface TextureToBufferContext {
  /** WebGPU 设备 */
  device: GPUDevice
  /** 源 GPUTexture */
  sourceTexture: GPUTexture
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
 * 执行纹理到缓冲区的复制
 *
 * @param ctx - 复制上下文
 * @param targetBuffer - 目标缓冲区
 */
function executeCopyTextureToBuffer(ctx: TextureToBufferContext, targetBuffer: GPUBuffer): void {
  const commandEncoder = ctx.device.createCommandEncoder()
  commandEncoder.copyTextureToBuffer(
    { texture: ctx.sourceTexture },
    {
      buffer: targetBuffer,
      bytesPerRow: ctx.alignedBytesPerRow,
      rowsPerImage: ctx.height
    },
    { width: ctx.width, height: ctx.height, depthOrArrayLayers: 1 }
  )
  ctx.device.queue.submit([commandEncoder.finish()])
}

/**
 * 创建紧凑格式的目标缓冲区（无行填充）
 * 当对齐字节数等于实际字节数时使用
 *
 * @param ctx - 复制上下文
 * @returns 创建的 GPUBuffer
 */
function createCompactTargetBuffer(ctx: TextureToBufferContext): GPUBuffer {
  const bufferSize = ctx.actualBytesPerRow * ctx.height

  return ctx.device.createBuffer({
    size: bufferSize,
    usage: DEFAULT_BUFFER_USAGE
  })
}

/**
 * 从对齐缓冲区提取紧凑数据
 * 去除每行末尾的填充字节
 *
 * @param ctx - 复制上下文
 * @param alignedBuffer - 对齐格式的源缓冲区
 * @returns 紧凑格式的目标缓冲区
 */
async function extractCompactDataFromAlignedBuffer(
  ctx: TextureToBufferContext,
  alignedBuffer: GPUBuffer
): Promise<GPUBuffer> {
  const alignedSize = ctx.alignedBytesPerRow * ctx.height
  const compactSize = ctx.actualBytesPerRow * ctx.height

  // 创建用于读取的暂存缓冲区
  const stagingBuffer = ctx.device.createBuffer({
    size: alignedSize,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
  })

  // 复制对齐缓冲区到暂存缓冲区
  const copyEncoder = ctx.device.createCommandEncoder()
  copyEncoder.copyBufferToBuffer(alignedBuffer, 0, stagingBuffer, 0, alignedSize)
  ctx.device.queue.submit([copyEncoder.finish()])

  // 映射并读取数据
  await stagingBuffer.mapAsync(GPUMapMode.READ)
  const alignedData = new Uint8Array(stagingBuffer.getMappedRange())

  // 创建紧凑格式的目标缓冲区
  const compactBuffer = ctx.device.createBuffer({
    size: compactSize,
    usage: DEFAULT_BUFFER_USAGE,
    mappedAtCreation: true
  })

  const compactData = new Uint8Array(compactBuffer.getMappedRange())

  // 逐行复制，去除填充
  for (let row = 0; row < ctx.height; row++) {
    const sourceOffset = row * ctx.alignedBytesPerRow
    const destOffset = row * ctx.actualBytesPerRow
    compactData.set(
      alignedData.subarray(sourceOffset, sourceOffset + ctx.actualBytesPerRow),
      destOffset
    )
  }

  compactBuffer.unmap()
  stagingBuffer.unmap()
  stagingBuffer.destroy()
  alignedBuffer.destroy()

  return compactBuffer
}

/**
 * 将 GPUTexture 数据复制到 GPUBuffer
 *
 * @param carrier - GPUTexture 载体
 * @param context - 转换上下文
 * @returns GPUBuffer 载体
 */
async function copyGPUTextureToGPUBuffer(
  carrier: GPUTextureCarrier,
  context: ConversionContext
): Promise<GPUBufferCarrier> {
  const { texture, width, height } = carrier.state
  const { device, factories } = context
  const alignedBytesPerRow = calculateAlignedBytesPerRow(width)
  const actualBytesPerRow = width * BYTES_PER_PIXEL

  // 构建复制上下文
  const ctx: TextureToBufferContext = {
    device,
    sourceTexture: texture,
    width,
    height,
    alignedBytesPerRow,
    actualBytesPerRow
  }

  // 无需行填充时，直接创建紧凑缓冲区
  if (alignedBytesPerRow === actualBytesPerRow) {
    const targetBuffer = createCompactTargetBuffer(ctx)
    executeCopyTextureToBuffer(ctx, targetBuffer)
    return factories.createGPUBufferCarrier({
      buffer: targetBuffer,
      width,
      height,
      bytesPerPixel: BYTES_PER_PIXEL
    })
  }

  // 需要行填充时，先复制到对齐缓冲区，再提取紧凑数据
  const alignedSize = alignedBytesPerRow * height
  const alignedBuffer = device.createBuffer({
    size: alignedSize,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
  })

  executeCopyTextureToBuffer(ctx, alignedBuffer)
  const compactBuffer = await extractCompactDataFromAlignedBuffer(ctx, alignedBuffer)

  return factories.createGPUBufferCarrier({
    buffer: compactBuffer,
    width,
    height,
    bytesPerPixel: BYTES_PER_PIXEL
  })
}

/**
 * GPUTexture → GPUBuffer 转换器
 *
 * 将 GPU 纹理中的像素数据复制到 GPU 缓冲区
 * 完全在 GPU 内部完成，开销为 low
 *
 * 实现细节：
 * - 创建具有 STORAGE、COPY_SRC、COPY_DST 用途的 GPUBuffer
 * - 使用 commandEncoder.copyTextureToBuffer() 复制数据
 * - 处理 WebGPU 的 256 字节行对齐要求
 * - 输出紧凑格式的缓冲区（无行填充）
 */
export const gpuTextureToGPUBufferConverter: Converter<'GPUTexture', 'GPUBuffer'> = {
  state: {
    sourceFormat: 'GPUTexture',
    targetFormat: 'GPUBuffer',
    metadata: {
      name: 'gpuTextureToGPUBuffer',
      description: 'Copy GPUTexture to GPUBuffer via GPU internal transfer',
      costLevel: 'low',
      isAsync: true
    }
  },
  /** @简洁函数 这是转换器接口要求的委托函数 */
  convert: async (source, context) => {
    return copyGPUTextureToGPUBuffer(source, context)
  }
}

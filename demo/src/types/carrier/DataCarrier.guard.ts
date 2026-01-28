/**
 * DataCarrier 类型体系 - 类型守卫函数
 * 
 * 提供类型守卫函数，实现编译时类型安全和运行时类型检查：
 * - 基础类型守卫：检查具体载体类型
 * - 组合类型守卫：检查载体类型组合
 * - 断言函数：强制类型断言，失败时抛出错误
 */

import type {
  AnyDataCarrier,
  GPUBufferCarrier,
  GPUTextureCarrier,
  ImageDataCarrier,
  CanvasCarrier,
  BlobCarrier,
  BlobURLCarrier,
  GPUCarrier,
  CPUCarrier,
  OutputCarrier,
  PipelineCarrier
} from './DataCarrier.types'

// ============================================================================
// 基础类型守卫函数
// ============================================================================

/**
 * 检查是否为 GPUBufferCarrier
 * @简洁函数 这是一个类型守卫谓词函数，用于TypeScript类型收窄
 */
export function isGPUBufferCarrier(carrier: AnyDataCarrier): carrier is GPUBufferCarrier {
  return carrier.state.format === 'GPUBuffer'
}

/**
 * 检查是否为 GPUTextureCarrier
 * @简洁函数 这是一个类型守卫谓词函数，用于TypeScript类型收窄
 */
export function isGPUTextureCarrier(carrier: AnyDataCarrier): carrier is GPUTextureCarrier {
  return carrier.state.format === 'GPUTexture'
}

/**
 * 检查是否为 ImageDataCarrier
 * @简洁函数 这是一个类型守卫谓词函数，用于TypeScript类型收窄
 */
export function isImageDataCarrier(carrier: AnyDataCarrier): carrier is ImageDataCarrier {
  return carrier.state.format === 'ImageData'
}

/**
 * 检查是否为 CanvasCarrier
 * @简洁函数 这是一个类型守卫谓词函数，用于TypeScript类型收窄
 */
export function isCanvasCarrier(carrier: AnyDataCarrier): carrier is CanvasCarrier {
  return carrier.state.format === 'Canvas'
}

/**
 * 检查是否为 BlobCarrier
 * @简洁函数 这是一个类型守卫谓词函数，用于TypeScript类型收窄
 */
export function isBlobCarrier(carrier: AnyDataCarrier): carrier is BlobCarrier {
  return carrier.state.format === 'Blob'
}

/**
 * 检查是否为 BlobURLCarrier
 * @简洁函数 这是一个类型守卫谓词函数，用于TypeScript类型收窄
 */
export function isBlobURLCarrier(carrier: AnyDataCarrier): carrier is BlobURLCarrier {
  return carrier.state.format === 'BlobURL'
}

// ============================================================================
// 组合类型守卫函数
// ============================================================================

/**
 * 检查是否为 GPU 相关载体
 * @简洁函数 这是一个类型守卫谓词函数，用于TypeScript类型收窄
 */
export function isGPUCarrier(carrier: AnyDataCarrier): carrier is GPUCarrier {
  return carrier.state.format === 'GPUBuffer' || carrier.state.format === 'GPUTexture'
}

/**
 * 检查是否为 CPU 相关载体
 * @简洁函数 这是一个类型守卫谓词函数，用于TypeScript类型收窄
 */
export function isCPUCarrier(carrier: AnyDataCarrier): carrier is CPUCarrier {
  return carrier.state.format === 'ImageData' || carrier.state.format === 'Canvas'
}

/**
 * 检查是否为输出相关载体
 * @简洁函数 这是一个类型守卫谓词函数，用于TypeScript类型收窄
 */
export function isOutputCarrier(carrier: AnyDataCarrier): carrier is OutputCarrier {
  return carrier.state.format === 'Blob' || carrier.state.format === 'BlobURL'
}

/**
 * 检查是否为管线载体
 * @简洁函数 这是一个类型守卫谓词函数，用于TypeScript类型收窄
 */
export function isPipelineCarrier(carrier: AnyDataCarrier): carrier is PipelineCarrier {
  return carrier.state.format === 'GPUBuffer' || carrier.state.format === 'GPUTexture'
}

// ============================================================================
// 断言函数
// ============================================================================

/**
 * 断言为 GPUBufferCarrier，否则抛出错误
 */
export function assertGPUBufferCarrier(
  carrier: AnyDataCarrier,
  message?: string
): asserts carrier is GPUBufferCarrier {
  if (!isGPUBufferCarrier(carrier)) {
    throw new TypeError(message ?? `Expected GPUBufferCarrier, got ${carrier.state.format}`)
  }
}

/**
 * 断言为 GPUTextureCarrier，否则抛出错误
 */
export function assertGPUTextureCarrier(
  carrier: AnyDataCarrier,
  message?: string
): asserts carrier is GPUTextureCarrier {
  if (!isGPUTextureCarrier(carrier)) {
    throw new TypeError(message ?? `Expected GPUTextureCarrier, got ${carrier.state.format}`)
  }
}

/**
 * 断言为 PipelineCarrier，否则抛出错误
 */
export function assertPipelineCarrier(
  carrier: AnyDataCarrier,
  message?: string
): asserts carrier is PipelineCarrier {
  if (!isPipelineCarrier(carrier)) {
    throw new TypeError(message ?? `Expected PipelineCarrier, got ${carrier.state.format}`)
  }
}

// ============================================================================
// 原始 GPU 资源类型守卫（用于兼容适配器）
// ============================================================================

/**
 * 检查是否为 GPUTexture 对象
 * 通过检测 createView 方法来判断
 * @简洁函数 这是一个类型守卫谓词函数，用于TypeScript类型收窄
 */
export function isGPUTexture(buffer: GPUBuffer | GPUTexture): buffer is GPUTexture {
  return 'createView' in buffer && typeof buffer.createView === 'function'
}

/**
 * 检查是否为 GPUBuffer 对象
 * 通过排除 GPUTexture 来判断
 * @简洁函数 这是一个类型守卫谓词函数，用于TypeScript类型收窄
 */
export function isGPUBuffer(buffer: GPUBuffer | GPUTexture): buffer is GPUBuffer {
  return !isGPUTexture(buffer)
}
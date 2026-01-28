/**
 * 内置转换器统一导出
 *
 * 提供所有内置转换器的统一访问入口
 */

// ============================================================================
// GPUBuffer ↔ CPU 转换器
// ============================================================================

import { gpuBufferToImageDataConverter } from './gpuBufferToImageData'
import { imageDataToGPUBufferConverter } from './imageDataToGPUBuffer'

// ============================================================================
// GPUTexture ↔ CPU 转换器
// ============================================================================

import { gpuTextureToImageDataConverter } from './gpuTextureToImageData'
import { imageDataToGPUTextureConverter } from './imageDataToGPUTexture'

// ============================================================================
// GPUBuffer ↔ GPUTexture 内部转换器
// ============================================================================

import { gpuBufferToGPUTextureConverter } from './gpuBufferToGPUTexture'
import { gpuTextureToGPUBufferConverter } from './gpuTextureToGPUBuffer'

// ============================================================================
// Canvas ↔ ImageData 转换器
// ============================================================================

import { canvasToImageDataConverter } from './canvasToImageData'
import { imageDataToCanvasConverter } from './imageDataToCanvas'

// ============================================================================
// Canvas → Blob 转换器
// ============================================================================

import { canvasToBlobConverter } from './canvasToBlob'

// ============================================================================
// 输出层转换器 (ImageData ↔ Blob ↔ BlobURL)
// ============================================================================

import { imageDataToBlobConverter } from './imageDataToBlob'
import { blobToImageDataConverter } from './blobToImageData'
import { blobToBlobURLConverter } from './blobToBlobURL'

// ============================================================================
// 统一导出
// ============================================================================

export {
  gpuBufferToImageDataConverter,
  imageDataToGPUBufferConverter,
  gpuTextureToImageDataConverter,
  imageDataToGPUTextureConverter,
  gpuBufferToGPUTextureConverter,
  gpuTextureToGPUBufferConverter,
  canvasToImageDataConverter,
  imageDataToCanvasConverter,
  canvasToBlobConverter,
  imageDataToBlobConverter,
  blobToImageDataConverter,
  blobToBlobURLConverter
}

// ============================================================================
// 内置转换器数组
// ============================================================================

/**
 * 所有内置转换器的数组
 * 可用于一次性注册到 ConverterRegistry
 *
 * 包含 12 个转换器：
 * - GPU ↔ ImageData: 4 个
 * - GPU 内部: 2 个
 * - Canvas ↔ ImageData: 2 个
 * - 输出层: 4 个
 */
export const builtinConverters = [
  // GPU ↔ ImageData
  gpuBufferToImageDataConverter,
  imageDataToGPUBufferConverter,
  gpuTextureToImageDataConverter,
  imageDataToGPUTextureConverter,

  // GPU 内部
  gpuBufferToGPUTextureConverter,
  gpuTextureToGPUBufferConverter,

  // Canvas ↔ ImageData
  canvasToImageDataConverter,
  imageDataToCanvasConverter,

  // 输出层
  imageDataToBlobConverter,
  canvasToBlobConverter,
  blobToImageDataConverter,
  blobToBlobURLConverter
] as const

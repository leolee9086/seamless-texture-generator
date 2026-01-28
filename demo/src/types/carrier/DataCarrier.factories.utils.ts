/**
 * DataCarrier 类型体系 - 工厂函数
 * 
 * 提供创建各种 DataCarrier 实例的工厂函数：
 * - createGPUBufferCarrier: 创建 GPU 缓冲区载体
 * - createGPUTextureCarrier: 创建 GPU 纹理载体
 * - createImageDataCarrier: 创建 ImageData 载体
 * - createCanvasCarrier: 创建 Canvas 载体
 * - createBlobCarrier: 创建 Blob 载体
 * - createBlobURLCarrier: 创建 Blob URL 载体
 */

import type {
  GPUBufferCarrier,
  GPUTextureCarrier,
  ImageDataCarrier,
  CanvasCarrier,
  BlobCarrier,
  BlobURLCarrier
} from './DataCarrier.types'

// ============================================================================
// 工厂函数参数接口
// ============================================================================

/**
 * 创建 GPUBufferCarrier 的参数
 */
export interface CreateGPUBufferCarrierParams {
  buffer: GPUBuffer
  width: number
  height: number
  usage?: GPUBufferUsageFlags
  bytesPerPixel?: number
}

/**
 * 创建 GPUTextureCarrier 的参数
 */
export interface CreateGPUTextureCarrierParams {
  texture: GPUTexture
  width: number
  height: number
  textureFormat?: GPUTextureFormat
  usage?: GPUTextureUsageFlags
}

/**
 * 创建 BlobCarrier 的参数
 */
export interface CreateBlobCarrierParams {
  blob: Blob
  width: number
  height: number
  mimeType?: string
}

/**
 * 创建 BlobURLCarrier 的参数
 */
export interface CreateBlobURLCarrierParams {
  url: string
  width: number
  height: number
  mimeType: string
}

// ============================================================================
// GPU 载体工厂函数
// ============================================================================

/**
 * 创建 GPUBufferCarrier
 */
export function createGPUBufferCarrier(
  params: CreateGPUBufferCarrierParams
): GPUBufferCarrier {
  const { buffer, width, height, usage, bytesPerPixel = 4 } = params
  
  return {
    state: {
      format: 'GPUBuffer',
      buffer,
      width,
      height,
      usage: usage ?? buffer.usage,
      bytesPerPixel
    },
    destroy(): void {
      buffer.destroy()
    }
  }
}

// ============================================================================
// CPU 载体工厂函数
// ============================================================================

/**
 * 创建 ImageDataCarrier
 */
export function createImageDataCarrier(imageData: ImageData): ImageDataCarrier {
  return {
    state: {
      format: 'ImageData',
      imageData,
      width: imageData.width,
      height: imageData.height
    },
    destroy(): void {
      // ImageData 无需显式销毁，由 GC 处理
    }
  }
}

/**
 * 创建 CanvasCarrier
 */
export function createCanvasCarrier(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  context?: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
): CanvasCarrier {
  return {
    state: {
      format: 'Canvas',
      canvas,
      context,
      width: canvas.width,
      height: canvas.height
    },
    destroy(): void {
      // Canvas 无需显式销毁，由 GC 处理
    }
  }
}

// ============================================================================
// 输出载体工厂函数
// ============================================================================

/**
 * 创建 BlobCarrier
 */
export function createBlobCarrier(
  params: CreateBlobCarrierParams
): BlobCarrier {
  const { blob, width, height, mimeType } = params
  
  return {
    state: {
      format: 'Blob',
      blob,
      width,
      height,
      mimeType: mimeType ?? blob.type
    },
    destroy(): void {
      // Blob 无需显式销毁，由 GC 处理
    }
  }
}

/**
 * 创建 BlobURLCarrier
 */
export function createBlobURLCarrier(
  params: CreateBlobURLCarrierParams
): BlobURLCarrier {
  const { url, width, height, mimeType } = params
  
  return {
    state: {
      format: 'BlobURL',
      url,
      width,
      height,
      mimeType
    },
    destroy(): void {
      URL.revokeObjectURL(url)
    }
  }
}

/**
 * 创建 GPUTextureCarrier
 */
export function createGPUTextureCarrier(
  params: CreateGPUTextureCarrierParams
): GPUTextureCarrier {
  const { texture, width, height, textureFormat, usage } = params
  
  return {
    state: {
      format: 'GPUTexture',
      texture,
      width,
      height,
      textureFormat: textureFormat ?? texture.format,
      usage: usage ?? texture.usage
    },
    destroy(): void {
      texture.destroy()
    }
  }
}
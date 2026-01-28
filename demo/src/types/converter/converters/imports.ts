/**
 * converters 模块内部导入转发
 *
 * 根据项目 ESLint 规则，禁止从父级目录直接导入
 * 所有外部依赖必须通过此文件转发
 */

// ============================================================================
// 从 converter 模块转发的类型
// ============================================================================

import type { Converter } from '../Converter.types'
import type { ConversionContext } from '../ConversionContext.types'

export type { Converter, ConversionContext }

// ============================================================================
// 从 carrier 模块转发的类型
// ============================================================================

import type {
  GPUBufferCarrier,
  GPUTextureCarrier,
  ImageDataCarrier,
  CanvasCarrier,
  BlobCarrier,
  BlobURLCarrier
} from '../imports'

export type {
  GPUBufferCarrier,
  GPUTextureCarrier,
  ImageDataCarrier,
  CanvasCarrier,
  BlobCarrier,
  BlobURLCarrier
}

// ============================================================================
// 从 carrier 模块转发的工厂函数
// ============================================================================

import {
  createImageDataCarrier,
  createCanvasCarrier,
  createGPUBufferCarrier,
  createGPUTextureCarrier,
  createBlobCarrier,
  createBlobURLCarrier
} from '../../carrier'

export {
  createImageDataCarrier,
  createCanvasCarrier,
  createGPUBufferCarrier,
  createGPUTextureCarrier,
  createBlobCarrier,
  createBlobURLCarrier
}

/**
 * DataCarrier 类型体系 - 统一导出
 * 
 * 提供统一的数据载体接口，支持多种数据格式的类型安全处理
 */

// ============================================================================
// 类型导出
// ============================================================================

import type {
  DataFormat,
  DataCarrierState,
  DataCarrierDestroy,
  DataCarrier,
  GPUBufferCarrierState,
  GPUTextureCarrierState,
  ImageDataCarrierState,
  CanvasCarrierState,
  BlobCarrierState,
  BlobURLCarrierState,
  GPUBufferCarrier,
  GPUTextureCarrier,
  ImageDataCarrier,
  CanvasCarrier,
  BlobCarrier,
  BlobURLCarrier,
  AnyDataCarrierState,
  GPUCarrierState,
  CPUCarrierState,
  OutputCarrierState,
  PipelineCarrierState,
  AnyDataCarrier,
  GPUCarrier,
  CPUCarrier,
  OutputCarrier,
  PipelineCarrier,
  DataCarrierMultiRecord,
  PipelineCarrierMultiRecord
} from './DataCarrier.types'

export type {
  DataFormat,
  DataCarrierState,
  DataCarrierDestroy,
  DataCarrier,
  GPUBufferCarrierState,
  GPUTextureCarrierState,
  ImageDataCarrierState,
  CanvasCarrierState,
  BlobCarrierState,
  BlobURLCarrierState,
  GPUBufferCarrier,
  GPUTextureCarrier,
  ImageDataCarrier,
  CanvasCarrier,
  BlobCarrier,
  BlobURLCarrier,
  AnyDataCarrierState,
  GPUCarrierState,
  CPUCarrierState,
  OutputCarrierState,
  PipelineCarrierState,
  AnyDataCarrier,
  GPUCarrier,
  CPUCarrier,
  OutputCarrier,
  PipelineCarrier,
  DataCarrierMultiRecord,
  PipelineCarrierMultiRecord
}

// ============================================================================
// 类型守卫导出
// ============================================================================

import {
  isGPUBufferCarrier,
  isGPUTextureCarrier,
  isImageDataCarrier,
  isCanvasCarrier,
  isBlobCarrier,
  isBlobURLCarrier,
  isGPUCarrier,
  isCPUCarrier,
  isOutputCarrier,
  isPipelineCarrier,
  assertGPUBufferCarrier,
  assertGPUTextureCarrier,
  assertPipelineCarrier,
  isGPUTexture,
  isGPUBuffer
} from './DataCarrier.guard'

export {
  isGPUBufferCarrier,
  isGPUTextureCarrier,
  isImageDataCarrier,
  isCanvasCarrier,
  isBlobCarrier,
  isBlobURLCarrier,
  isGPUCarrier,
  isCPUCarrier,
  isOutputCarrier,
  isPipelineCarrier,
  assertGPUBufferCarrier,
  assertGPUTextureCarrier,
  assertPipelineCarrier,
  isGPUTexture,
  isGPUBuffer
}

// ============================================================================
// 工厂函数导出
// ============================================================================

import type {
  CreateGPUBufferCarrierParams,
  CreateGPUTextureCarrierParams,
  CreateBlobCarrierParams,
  CreateBlobURLCarrierParams
} from './DataCarrier.factories.utils'

import {
  createGPUBufferCarrier,
  createGPUTextureCarrier,
  createImageDataCarrier,
  createCanvasCarrier,
  createBlobCarrier,
  createBlobURLCarrier
} from './DataCarrier.factories.utils'

export type {
  CreateGPUBufferCarrierParams,
  CreateGPUTextureCarrierParams,
  CreateBlobCarrierParams,
  CreateBlobURLCarrierParams
}

export {
  createGPUBufferCarrier,
  createGPUTextureCarrier,
  createImageDataCarrier,
  createCanvasCarrier,
  createBlobCarrier,
  createBlobURLCarrier
}

// ============================================================================
// 兼容适配器导出
// ============================================================================

import {
  fromPipelineData,
  toPipelineData,
  fromPipelineDataMultiRecord,
  toPipelineDataMultiRecord
} from './DataCarrier.compat.utils'

export {
  fromPipelineData,
  toPipelineData,
  fromPipelineDataMultiRecord,
  toPipelineDataMultiRecord
}

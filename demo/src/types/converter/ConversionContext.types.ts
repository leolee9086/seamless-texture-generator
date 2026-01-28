/**
 * ConversionContext 转换上下文类型定义
 *
 * 提供转换过程中所需的资源和配置接口
 */

import type { DataFormat } from './imports'
import type { CarrierOfFormat } from './CarrierOfFormat.types'
import type {
  GPUBufferCarrier,
  GPUTextureCarrier,
  ImageDataCarrier,
  CanvasCarrier,
  BlobCarrier,
  BlobURLCarrier,
  CreateGPUBufferCarrierParams,
  CreateGPUTextureCarrierParams,
  CreateBlobCarrierParams,
  CreateBlobURLCarrierParams
} from './imports'

/**
 * 转换缓存接口
 *
 * 使用 WeakMap 实现，当源对象被 GC 回收时缓存自动清除
 */
export interface ConversionCache {
  /**
   * 获取缓存的转换结果
   * @param source - 源数据对象
   * @param targetFormat - 目标格式
   * @returns 缓存的转换结果，如果不存在则返回 undefined
   */
  get<T extends DataFormat>(source: unknown, targetFormat: T): CarrierOfFormat<T> | undefined

  /**
   * 设置缓存
   * @param source - 源数据对象
   * @param targetFormat - 目标格式
   * @param result - 转换结果
   */
  set<T extends DataFormat>(source: unknown, targetFormat: T, result: CarrierOfFormat<T>): void

  /**
   * 清除指定源的所有缓存
   * @param source - 源数据对象
   */
  invalidate(source: unknown): void

  /**
   * 清除所有缓存
   */
  clear(): void
}

/**
 * 转换性能指标
 */
export interface ConversionMetrics {
  /** 源格式 */
  readonly sourceFormat: DataFormat
  /** 目标格式 */
  readonly targetFormat: DataFormat
  /** 转换耗时（毫秒） */
  readonly durationMs: number
  /** 是否命中缓存 */
  readonly cached: boolean
}

/**
 * 性能指标回调函数类型
 */
export type MetricsCallback = (metrics: ConversionMetrics) => void

/**
 * Carrier 工厂函数接口
 *
 * 提供创建各种 DataCarrier 实例的工厂函数
 * 通过依赖注入方式传递给转换器，避免值导入
 */
export interface CarrierFactories {
  /** 创建 GPUBuffer 载体 */
  createGPUBufferCarrier: (params: CreateGPUBufferCarrierParams) => GPUBufferCarrier
  /** 创建 GPUTexture 载体 */
  createGPUTextureCarrier: (params: CreateGPUTextureCarrierParams) => GPUTextureCarrier
  /** 创建 ImageData 载体 */
  createImageDataCarrier: (imageData: ImageData) => ImageDataCarrier
  /** 创建 Canvas 载体 */
  createCanvasCarrier: (
    canvas: HTMLCanvasElement | OffscreenCanvas,
    context?: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
  ) => CanvasCarrier
  /** 创建 Blob 载体 */
  createBlobCarrier: (params: CreateBlobCarrierParams) => BlobCarrier
  /** 创建 BlobURL 载体 */
  createBlobURLCarrier: (params: CreateBlobURLCarrierParams) => BlobURLCarrier
}

/**
 * 转换上下文接口
 *
 * 提供转换过程中所需的资源和配置
 */
export interface ConversionContext {
  /** WebGPU 设备实例 - GPU 相关转换必需 */
  readonly device: GPUDevice
  /** 转换缓存 - 用于避免重复转换 */
  readonly cache: ConversionCache
  /** Carrier 工厂函数 - 用于创建转换结果载体 */
  readonly factories: CarrierFactories
  /** 性能监控回调 */
  readonly metrics?: MetricsCallback
  /** 取消信号 - 支持中断长时间转换 */
  readonly signal?: AbortSignal
}

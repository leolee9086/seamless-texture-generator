/**
 * ConverterRegistry 注册表类型定义
 *
 * 管理所有转换器的注册、查找和执行
 */

import type { DataFormat } from './imports'
import type { AnyConverter, Converter } from './Converter.types'
import type { ConversionCache, ConversionContext, MetricsCallback, CarrierFactories } from './ConversionContext.types'

/**
 * 转换路径信息
 *
 * 描述从源格式到目标格式的转换路径
 */
export interface ConversionPath {
  /** 转换路径中的转换器序列 */
  readonly steps: ReadonlyArray<AnyConverter>
  /** 总开销（基于开销等级权重计算） */
  readonly totalCost: number
}

/**
 * 路径查找节点
 *
 * 用于 Dijkstra 算法的优先队列
 */
export interface PathNode {
  /** 当前格式 */
  readonly format: DataFormat
  /** 到达当前节点的转换器序列 */
  readonly converters: ReadonlyArray<AnyConverter>
  /** 累计开销 */
  readonly cost: number
}

/**
 * 路径查找上下文
 *
 * 用于 Dijkstra 算法的内部状态和节点扩展
 */
export interface PathFindingContext {
  /** 当前节点 */
  readonly current: PathNode
  /** 目标格式 */
  readonly targetFormat: DataFormat
  /** 已访问节点集合 */
  readonly visited: Set<DataFormat>
}

/**
 * 转换执行上下文
 *
 * 用于执行转换时的参数传递
 */
export interface ConversionExecutionContext<TTo extends DataFormat = DataFormat> {
  /** 源数据 */
  readonly source: unknown
  /** 源格式 */
  readonly sourceFormat: DataFormat
  /** 目标格式 */
  readonly targetFormat: TTo
  /** 转换上下文 */
  readonly context: ConversionContext
}

/**
 * 性能指标上下文
 *
 * 用于报告性能指标
 */
export interface MetricsReportContext {
  /** 转换上下文 */
  readonly context: ConversionContext
  /** 源格式 */
  readonly sourceFormat: DataFormat
  /** 目标格式 */
  readonly targetFormat: DataFormat
  /** 耗时（毫秒） */
  readonly durationMs: number
  /** 是否命中缓存 */
  readonly cached: boolean
}

// ============================================================================
// 工厂函数类型定义
// ============================================================================

/**
 * ConverterRegistry 创建选项
 */
export interface ConverterRegistryOptions {
  /**
   * 是否自动注册所有内置转换器
   * @default true
   */
  registerBuiltins?: boolean

  /**
   * 自定义转换器列表（在内置转换器之后注册）
   * @default undefined
   */
  customConverters?: ReadonlyArray<Converter<DataFormat, DataFormat>>
}

/**
 * ConversionContext 创建参数
 */
export interface ConversionContextParams {
  /** WebGPU 设备实例 */
  device: GPUDevice
  /** Carrier 工厂函数 */
  factories: CarrierFactories
  /** 转换缓存实例（可选，默认创建新实例） */
  cache?: ConversionCache
  /** 性能指标回调（可选） */
  metrics?: MetricsCallback
  /** 取消信号（可选） */
  signal?: AbortSignal
}

/**
 * Converter 转换器类型定义
 *
 * 定义从一种格式到另一种格式的转换能力接口
 */

import type { DataFormat } from './imports'
import type { CarrierOfFormat } from './CarrierOfFormat.types'
import type { ConversionContext } from './ConversionContext.types'

/**
 * 转换开销等级
 *
 * 用于路径优化时选择最优转换路径
 */
export type ConversionCostLevel =
  | 'trivial'    // 几乎无开销（如类型包装）
  | 'low'        // 低开销（纯 CPU 内存操作）
  | 'medium'     // 中等开销（GPU↔CPU 传输）
  | 'high'       // 高开销（涉及编解码）

/**
 * 转换器元数据
 *
 * 描述转换器的能力和特性
 */
export interface ConverterMetadata {
  /** 转换器名称 */
  readonly name: string
  /** 转换器描述 */
  readonly description?: string
  /** 预估的性能开销等级 */
  readonly costLevel: ConversionCostLevel
  /** 是否为异步转换 */
  readonly isAsync: boolean
}

/**
 * 转换器状态接口（纯数据）
 *
 * 包含转换器的静态配置信息
 *
 * @template TFrom - 源格式类型
 * @template TTo - 目标格式类型
 */
export interface ConverterState<TFrom extends DataFormat, TTo extends DataFormat> {
  /** 源格式 */
  readonly sourceFormat: TFrom
  /** 目标格式 */
  readonly targetFormat: TTo
  /** 转换器元数据 */
  readonly metadata: ConverterMetadata
}

/**
 * 转换函数类型
 *
 * 执行实际的格式转换操作
 *
 * @template TFrom - 源格式类型
 * @template TTo - 目标格式类型
 */
export type ConvertFn<TFrom extends DataFormat, TTo extends DataFormat> = (
  source: CarrierOfFormat<TFrom>,
  context: ConversionContext
) => Promise<CarrierOfFormat<TTo>>

/**
 * 转换器包装接口
 *
 * 遵循 ECS 设计原则，将状态和行为分离
 *
 * @template TFrom - 源格式类型
 * @template TTo - 目标格式类型
 */
export interface Converter<TFrom extends DataFormat, TTo extends DataFormat> {
  /** 转换器状态（纯数据） */
  readonly state: ConverterState<TFrom, TTo>
  /** 转换函数 */
  readonly convert: ConvertFn<TFrom, TTo>
}

/**
 * 任意转换器类型
 *
 * 用于存储不同类型转换器的集合
 */
export type AnyConverter = Converter<DataFormat, DataFormat>

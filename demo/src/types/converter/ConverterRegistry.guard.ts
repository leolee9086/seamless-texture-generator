/**
 * ConverterRegistry 类型守卫
 *
 * 提供类型安全的转换和验证函数
 */

import type { DataFormat, AnyDataCarrier } from './imports'
import type { CarrierOfFormat } from './CarrierOfFormat.types'
import type { AnyConverter } from './Converter.types'

// ============================================================================
// 载体类型守卫
// ============================================================================

/**
 * 从载体中提取格式
 *
 * @简洁函数 这是类型守卫工具函数
 * @param carrier - 数据载体
 * @returns 数据格式
 */
export function getCarrierFormat(carrier: AnyDataCarrier): DataFormat {
  return carrier.state.format
}

/**
 * 将载体转换为目标格式类型
 *
 * 用于类型安全的格式转换，当源格式和目标格式相同时使用
 *
 * @template TTo - 目标格式类型
 * @param carrier - 源载体
 * @returns 转换后的载体
 */
export function castCarrierToFormat<TTo extends DataFormat>(
  carrier: AnyDataCarrier
): CarrierOfFormat<TTo> {
  // 运行时不做任何转换，仅用于类型系统
  return carrier as unknown as CarrierOfFormat<TTo>
}

// ============================================================================
// 转换器类型守卫
// ============================================================================

/**
 * 将转换器转换为 AnyConverter 类型
 *
 * 用于存储到 Map 中时的类型转换
 *
 * @param converter - 具体类型的转换器
 * @returns AnyConverter 类型
 */
export function toAnyConverter<TFrom extends DataFormat, TTo extends DataFormat>(
  converter: { state: { sourceFormat: TFrom; targetFormat: TTo }; convert: unknown }
): AnyConverter {
  return converter as unknown as AnyConverter
}

// ============================================================================
// 转换结果类型守卫
// ============================================================================

/**
 * 将转换结果转换为目标格式类型
 *
 * @template TTo - 目标格式类型
 * @param result - 转换结果
 * @returns 类型化的转换结果
 */
export function castConversionResult<TTo extends DataFormat>(
  result: unknown
): CarrierOfFormat<TTo> {
  return result as CarrierOfFormat<TTo>
}

/**
 * 将载体转换为通用载体类型用于转换函数调用
 *
 * @简洁函数 这是类型守卫工具函数
 * @param carrier - 当前载体
 * @returns 通用载体类型
 */
export function castToCarrierOfFormat(carrier: unknown): CarrierOfFormat<DataFormat> {
  return carrier as CarrierOfFormat<DataFormat>
}

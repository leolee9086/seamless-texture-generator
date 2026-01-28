/**
 * ConverterRegistry 常量定义
 *
 * 包含转换器注册表相关的常量值
 */

import type { ConversionCostLevel } from './Converter.types'

// ============================================================================
// 开销等级权重
// ============================================================================

/**
 * 开销等级到数值的映射
 *
 * 用于 Dijkstra 算法计算路径权重
 */
export const COST_LEVEL_VALUES: Readonly<Record<ConversionCostLevel, number>> = {
  trivial: 1,
  low: 2,
  medium: 4,
  high: 8
} as const

// ============================================================================
// 键格式
// ============================================================================

/**
 * 转换器注册键分隔符
 */
export const CONVERTER_KEY_SEPARATOR = '->'

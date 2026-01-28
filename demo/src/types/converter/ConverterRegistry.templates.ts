/**
 * ConverterRegistry 模板字符串
 *
 * 包含错误消息和格式化模板
 */

import type { DataFormat } from './imports'
import { CONVERTER_KEY_SEPARATOR } from './ConverterRegistry.constants'

// ============================================================================
// 错误消息模板
// ============================================================================

/**
 * 生成无法找到转换路径的错误消息
 *
 * @param sourceFormat - 源格式
 * @param targetFormat - 目标格式
 * @returns 格式化的错误消息
 */
export function getNoPathFoundMessage(
  sourceFormat: DataFormat,
  targetFormat: DataFormat
): string {
  return `无法找到从 ${sourceFormat} 到 ${targetFormat} 的转换路径`
}

/**
 * 转换被取消的错误消息
 */
export const CONVERSION_CANCELLED_MESSAGE = '转换被取消'

// ============================================================================
// 键格式化
// ============================================================================

/**
 * 生成转换器注册键
 *
 * @简洁函数 这是字符串格式化工具函数
 * @param source - 源格式
 * @param target - 目标格式
 * @returns 格式化的键字符串
 */
export function formatConverterKey(source: DataFormat, target: DataFormat): string {
  return `${source}${CONVERTER_KEY_SEPARATOR}${target}`
}

/**
 * 生成键前缀（用于查找从某格式出发的所有转换器）
 *
 * @简洁函数 这是字符串格式化工具函数
 * @param source - 源格式
 * @returns 键前缀字符串
 */
export function formatKeyPrefix(source: DataFormat): string {
  return `${source}${CONVERTER_KEY_SEPARATOR}`
}

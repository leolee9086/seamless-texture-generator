/**
 * ConversionCache 类型守卫
 */

import type { DataFormat } from './imports'
import type { CarrierOfFormat } from './CarrierOfFormat.types'
import { TYPEOF_OBJECT } from './ConversionCache.constants'

/**
 * 检查值是否为对象类型（可用作 WeakMap 键）
 *
 * @简洁函数 这是一个类型守卫谓词函数
 * @param value - 要检查的值
 * @returns 如果值是非空对象则返回 true
 */
export function isObjectKey(value: unknown): value is object {
  return value !== null && value !== undefined && typeof value === TYPEOF_OBJECT
}

/**
 * 从 Map 中获取缓存结果并进行类型守卫
 *
 * @template T - 目标格式类型
 * @param formatCache - 格式缓存 Map
 * @param targetFormat - 目标格式
 * @returns 缓存的转换结果，如果不存在则返回 undefined
 */
export function getCachedResult<T extends DataFormat>(
  formatCache: Map<DataFormat, unknown> | undefined,
  targetFormat: T
): CarrierOfFormat<T> | undefined {
  if (formatCache === undefined) {
    return undefined
  }

  const result = formatCache.get(targetFormat)
  if (result === undefined) {
    return undefined
  }

  // 由于缓存是由 set 方法设置的，类型是正确的
  // 这里使用类型守卫模式返回
  return result as CarrierOfFormat<T>
}

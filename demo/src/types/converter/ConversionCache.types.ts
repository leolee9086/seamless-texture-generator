/**
 * ConversionCache 相关类型定义
 */

import type { DataFormat } from './imports'

/**
 * 缓存存储类型
 *
 * 外层 WeakMap 以源对象为键，内层 Map 以目标格式为键
 */
export type CacheStorage = WeakMap<object, Map<DataFormat, unknown>>

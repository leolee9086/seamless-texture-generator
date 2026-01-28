/**
 * ConversionCache 转换缓存实现
 *
 * 基于 WeakMap 实现的转换缓存，当源对象被 GC 回收时缓存自动清除
 */

import type { DataFormat } from './imports'
import type { ConversionCache } from './ConversionContext.types'
import type { CarrierOfFormat } from './CarrierOfFormat.types'
import type { CacheStorage } from './ConversionCache.types'
import { isObjectKey, getCachedResult } from './ConversionCache.guard'

/**
 * 转换缓存实现类
 *
 * 使用 WeakMap 存储缓存，避免内存泄漏：
 * - 外层 WeakMap：以源对象为键，当源对象被 GC 回收时自动清除
 * - 内层 Map：以目标格式为键，存储转换结果
 *
 * @implements {ConversionCache}
 */
export class ConversionCacheImpl implements ConversionCache {
  /**
   * 缓存存储
   *
   * 结构：source -> Map<targetFormat, result>
   */
  private cache: CacheStorage = new WeakMap()

  /**
   * 强引用集合，用于 clear() 方法
   *
   * WeakMap 无法遍历，需要维护额外的引用列表以支持清除操作
   */
  private strongRefs: Set<object> = new Set()

  /**
   * 获取缓存的转换结果
   *
   * @template T - 目标格式类型
   * @param source - 源数据对象
   * @param targetFormat - 目标格式
   * @returns 缓存的转换结果，如果不存在则返回 undefined
   */
  get<T extends DataFormat>(source: unknown, targetFormat: T): CarrierOfFormat<T> | undefined {
    if (!isObjectKey(source)) {
      return undefined
    }

    const formatCache = this.cache.get(source)
    return getCachedResult(formatCache, targetFormat)
  }

  /**
   * 设置缓存
   *
   * @template T - 目标格式类型
   * @param source - 源数据对象
   * @param targetFormat - 目标格式
   * @param result - 转换结果
   */
  set<T extends DataFormat>(source: unknown, targetFormat: T, result: CarrierOfFormat<T>): void {
    if (!isObjectKey(source)) {
      return
    }

    let formatCache = this.cache.get(source)
    if (formatCache === undefined) {
      formatCache = new Map()
      this.cache.set(source, formatCache)
      this.strongRefs.add(source)
    }

    formatCache.set(targetFormat, result)
  }

  /**
   * 清除指定源的所有缓存
   *
   * @param source - 源数据对象
   */
  invalidate(source: unknown): void {
    if (!isObjectKey(source)) {
      return
    }

    this.cache.delete(source)
    this.strongRefs.delete(source)
  }

  /** @简洁函数 这是接口要求的清除方法，逻辑简单但必须独立存在 */
  clear(): void {
    this.cache = new WeakMap()
    this.strongRefs.clear()
  }
}

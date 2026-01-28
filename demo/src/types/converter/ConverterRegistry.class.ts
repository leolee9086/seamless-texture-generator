/**
 * ConverterRegistry 转换器注册表实现
 *
 * 管理所有转换器的注册、查找和执行
 * 使用 Dijkstra 变体算法查找最优转换路径
 */

import type { DataFormat } from './imports'
import type { CarrierOfFormat } from './CarrierOfFormat.types'
import type { ConversionContext } from './ConversionContext.types'
import type { Converter, AnyConverter } from './Converter.types'
import type {
  ConversionPath,
  PathNode,
  PathFindingContext,
  ConversionExecutionContext,
  MetricsReportContext
} from './ConverterRegistry.types'
import { COST_LEVEL_VALUES } from './ConverterRegistry.constants'
import {
  formatConverterKey,
  formatKeyPrefix,
  getNoPathFoundMessage,
  CONVERSION_CANCELLED_MESSAGE
} from './ConverterRegistry.templates'
import {
  getCarrierFormat,
  castCarrierToFormat,
  toAnyConverter,
  castConversionResult,
  castToCarrierOfFormat
} from './ConverterRegistry.guard'

// ============================================================================
// 优先队列实现
// ============================================================================

/**
 * 简单优先队列实现
 *
 * 使用数组模拟，按优先级排序
 * 对于小规模图（6个节点）足够高效
 */
class PriorityQueue<T> {
  private items: Array<{ element: T; priority: number }> = []

  /**
   * 入队
   *
   * @param element - 元素
   * @param priority - 优先级（越小越优先）
   */
  enqueue(element: T, priority: number): void {
    const item = { element, priority }
    let added = false

    for (let index = 0; index < this.items.length; index++) {
      if (priority < this.items[index].priority) {
        this.items.splice(index, 0, item)
        added = true
        break
      }
    }

    if (!added) {
      this.items.push(item)
    }
  }

  /**
   * 出队
   *
   * @简洁函数 这是队列基本操作
   * @returns 优先级最高的元素，如果队列为空则返回 undefined
   */
  dequeue(): T | undefined {
    const item = this.items.shift()
    return item?.element
  }

  /**
   * 检查队列是否为空
   *
   * @简洁函数 这是队列状态检查函数
   */
  isEmpty(): boolean {
    return this.items.length === 0
  }
}

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 报告性能指标
 *
 * @param ctx - 性能指标上下文
 */
function reportMetrics(ctx: MetricsReportContext): void {
  if (ctx.context.metrics !== undefined) {
    ctx.context.metrics({
      sourceFormat: ctx.sourceFormat,
      targetFormat: ctx.targetFormat,
      durationMs: ctx.durationMs,
      cached: ctx.cached
    })
  }
}

// ============================================================================
// ConverterRegistryImpl 类实现
// ============================================================================

/**
 * 转换器注册表实现类
 *
 * 提供转换器的注册、注销、路径查找和转换执行功能
 */
export class ConverterRegistryImpl {
  /**
   * 存储已注册的转换器
   *
   * 键格式: "sourceFormat->targetFormat"
   */
  private converters: Map<string, AnyConverter> = new Map()

  /**
   * 注册转换器
   *
   * @template TFrom - 源格式类型
   * @template TTo - 目标格式类型
   * @param converter - 要注册的转换器
   */
  register<TFrom extends DataFormat, TTo extends DataFormat>(
    converter: Converter<TFrom, TTo>
  ): void {
    const key = formatConverterKey(
      converter.state.sourceFormat,
      converter.state.targetFormat
    )
    this.converters.set(key, toAnyConverter(converter))
  }

  /**
   * 注销转换器
   *
   * @简洁函数 这是接口要求的注销方法
   * @param sourceFormat - 源格式
   * @param targetFormat - 目标格式
   * @returns 是否成功注销
   */
  unregister(sourceFormat: DataFormat, targetFormat: DataFormat): boolean {
    const key = formatConverterKey(sourceFormat, targetFormat)
    return this.converters.delete(key)
  }

  /**
   * 查找转换路径（使用 Dijkstra 变体算法）
   *
   * @param sourceFormat - 源格式
   * @param targetFormat - 目标格式
   * @returns 转换路径，如果不存在则返回 null
   */
  findPath(sourceFormat: DataFormat, targetFormat: DataFormat): ConversionPath | null {
    // 源和目标相同，返回空路径
    if (sourceFormat === targetFormat) {
      return { steps: [], totalCost: 0 }
    }

    // 检查是否存在直接转换器
    const directPath = this.findDirectPath(sourceFormat, targetFormat)
    if (directPath !== null) {
      return directPath
    }

    // 使用 Dijkstra 算法查找最优路径
    return this.findOptimalPath(sourceFormat, targetFormat)
  }

  /**
   * 查找直接转换路径
   *
   * @param sourceFormat - 源格式
   * @param targetFormat - 目标格式
   * @returns 直接转换路径，如果不存在则返回 null
   */
  private findDirectPath(
    sourceFormat: DataFormat,
    targetFormat: DataFormat
  ): ConversionPath | null {
    const directKey = formatConverterKey(sourceFormat, targetFormat)
    const directConverter = this.converters.get(directKey)

    if (directConverter !== undefined) {
      return {
        steps: [directConverter],
        totalCost: COST_LEVEL_VALUES[directConverter.state.metadata.costLevel]
      }
    }

    return null
  }

  /**
   * 使用 Dijkstra 算法查找最优路径
   *
   * @param sourceFormat - 源格式
   * @param targetFormat - 目标格式
   * @returns 最优转换路径，如果不存在则返回 null
   */
  private findOptimalPath(
    sourceFormat: DataFormat,
    targetFormat: DataFormat
  ): ConversionPath | null {
    const queue = new PriorityQueue<PathNode>()
    const visited = new Set<DataFormat>()

    // 初始化起点
    queue.enqueue({ format: sourceFormat, converters: [], cost: 0 }, 0)

    while (!queue.isEmpty()) {
      const current = queue.dequeue()
      if (current === undefined) {
        break
      }

      // 跳过已访问的节点
      if (visited.has(current.format)) {
        continue
      }
      visited.add(current.format)

      // 尝试扩展当前节点
      const ctx: PathFindingContext = { current, targetFormat, visited }
      const result = this.expandNode(ctx, queue)
      if (result !== null) {
        return result
      }
    }

    return null
  }

  /**
   * 扩展当前节点，查找相邻节点
   *
   * @param ctx - 路径查找上下文
   * @param queue - 优先队列
   * @returns 如果找到目标则返回路径，否则返回 null
   */
  private expandNode(
    ctx: PathFindingContext,
    queue: PriorityQueue<PathNode>
  ): ConversionPath | null {
    const prefix = formatKeyPrefix(ctx.current.format)

    for (const [key, converter] of this.converters) {
      if (!key.startsWith(prefix)) {
        continue
      }

      const nextFormat = converter.state.targetFormat
      if (ctx.visited.has(nextFormat)) {
        continue
      }

      const edgeCost = COST_LEVEL_VALUES[converter.state.metadata.costLevel]
      const newCost = ctx.current.cost + edgeCost
      const newConverters = [...ctx.current.converters, converter]

      // 找到目标格式
      if (nextFormat === ctx.targetFormat) {
        return { steps: newConverters, totalCost: newCost }
      }

      // 将新节点加入队列
      queue.enqueue(
        { format: nextFormat, converters: newConverters, cost: newCost },
        newCost
      )
    }

    return null
  }

  /**
   * 执行转换
   *
   * @template TFrom - 源格式类型
   * @template TTo - 目标格式类型
   * @param source - 源数据载体
   * @param targetFormat - 目标格式
   * @param context - 转换上下文
   * @returns 转换后的数据载体
   */
  async convert<TFrom extends DataFormat, TTo extends DataFormat>(
    source: CarrierOfFormat<TFrom>,
    targetFormat: TTo,
    context: ConversionContext
  ): Promise<CarrierOfFormat<TTo>> {
    const sourceFormat = getCarrierFormat(source)

    // 源和目标相同，直接返回
    if (sourceFormat === targetFormat) {
      return castCarrierToFormat<TTo>(source)
    }

    // 检查缓存
    const cached = context.cache.get(source, targetFormat)
    if (cached !== undefined) {
      reportMetrics({
        context,
        sourceFormat,
        targetFormat,
        durationMs: 0,
        cached: true
      })
      return cached
    }

    // 执行实际转换
    const execCtx: ConversionExecutionContext<TTo> = {
      source,
      sourceFormat,
      targetFormat,
      context
    }
    return this.executeConversion(execCtx)
  }

  /**
   * 执行实际转换逻辑
   *
   * @param ctx - 转换执行上下文
   * @returns 转换后的数据载体
   */
  private async executeConversion<TTo extends DataFormat>(
    ctx: ConversionExecutionContext<TTo>
  ): Promise<CarrierOfFormat<TTo>> {
    // 查找转换路径
    const path = this.findPath(ctx.sourceFormat, ctx.targetFormat)
    if (path === null) {
      throw new Error(getNoPathFoundMessage(ctx.sourceFormat, ctx.targetFormat))
    }

    const startTime = performance.now()
    let current: unknown = ctx.source

    // 执行链式转换
    for (const converter of path.steps) {
      if (ctx.context.signal?.aborted === true) {
        throw new Error(CONVERSION_CANCELLED_MESSAGE)
      }
      current = await converter.convert(castToCarrierOfFormat(current), ctx.context)
    }

    const result = castConversionResult<TTo>(current)

    // 缓存结果
    ctx.context.cache.set(ctx.source, ctx.targetFormat, result)

    // 报告性能指标
    const duration = performance.now() - startTime
    reportMetrics({
      context: ctx.context,
      sourceFormat: ctx.sourceFormat,
      targetFormat: ctx.targetFormat,
      durationMs: duration,
      cached: false
    })

    return result
  }

  /**
   * 获取所有已注册转换器
   *
   * @简洁函数 这是接口要求的查询方法
   * @returns 只读的转换器数组
   */
  getRegisteredConverters(): ReadonlyArray<AnyConverter> {
    return Array.from(this.converters.values())
  }
}


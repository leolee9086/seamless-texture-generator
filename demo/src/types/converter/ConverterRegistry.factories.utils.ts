/**
 * ConverterRegistry 工厂函数
 *
 * 提供便捷的工厂函数用于创建和初始化转换器注册表及上下文
 */

import type { ConversionContext } from './ConversionContext.types'
import type {
  ConverterRegistryOptions,
  ConversionContextParams
} from './ConverterRegistry.types'
import { ConverterRegistryImpl } from './ConverterRegistry.class'
import { ConversionCacheImpl } from './ConversionCache.class'
import { builtinConverters } from './converters/index'

/**
 * 创建并初始化 ConverterRegistry，注册所有内置转换器
 *
 * @param options - 创建选项
 * @returns 初始化完成的 ConverterRegistry 实例
 *
 * @example
 * ```typescript
 * // 创建并自动注册所有内置转换器
 * const registry = createConverterRegistry()
 *
 * // 创建空注册表（不注册内置转换器）
 * const emptyRegistry = createConverterRegistry({ registerBuiltins: false })
 * ```
 */
export function createConverterRegistry(
  options?: ConverterRegistryOptions
): ConverterRegistryImpl {
  const registry = new ConverterRegistryImpl()
  const shouldRegisterBuiltins = options?.registerBuiltins ?? true

  if (shouldRegisterBuiltins) {
    // 注册所有内置转换器
    for (const converter of builtinConverters) {
      registry.register(converter)
    }
  }

  // 注册自定义转换器
  if (options?.customConverters !== undefined) {
    for (const converter of options.customConverters) {
      registry.register(converter)
    }
  }

  return registry
}

/**
 * 创建转换上下文
 *
 * @param params - 上下文参数
 * @returns 转换上下文对象
 *
 * @example
 * ```typescript
 * const context = createConversionContext({
 *   device: gpuDevice,
 *   metrics: (m) => console.log(`转换耗时: ${m.durationMs}ms`)
 * })
 * ```
 */
export function createConversionContext(
  params: ConversionContextParams
): ConversionContext {
  return {
    device: params.device,
    cache: params.cache ?? new ConversionCacheImpl(),
    factories: params.factories,
    metrics: params.metrics,
    signal: params.signal
  }
}

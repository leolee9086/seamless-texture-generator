/**
 * ConverterRegistry 类型体系 - 统一导出
 *
 * 提供统一的格式转换器接口，支持多种数据格式的类型安全转换
 */

// ============================================================================
// CarrierOfFormat 类型映射
// ============================================================================

import type { CarrierOfFormat } from './CarrierOfFormat.types'

export type { CarrierOfFormat }

// ============================================================================
// ConversionContext 上下文类型
// ============================================================================

import type {
  ConversionCache,
  ConversionMetrics,
  MetricsCallback,
  ConversionContext
} from './ConversionContext.types'

export type {
  ConversionCache,
  ConversionMetrics,
  MetricsCallback,
  ConversionContext
}

// ============================================================================
// Converter 转换器类型
// ============================================================================

import type {
  ConversionCostLevel,
  ConverterMetadata,
  ConverterState,
  ConvertFn,
  Converter,
  AnyConverter
} from './Converter.types'

export type {
  ConversionCostLevel,
  ConverterMetadata,
  ConverterState,
  ConvertFn,
  Converter,
  AnyConverter
}

// ============================================================================
// ConverterRegistry 注册表类型
// ============================================================================

import type {
  ConversionPath,
  PathNode,
  PathFindingContext,
  ConversionExecutionContext,
  MetricsReportContext,
  ConverterRegistryOptions,
  ConversionContextParams
} from './ConverterRegistry.types'

export type {
  ConversionPath,
  PathNode,
  PathFindingContext,
  ConversionExecutionContext,
  MetricsReportContext,
  ConverterRegistryOptions,
  ConversionContextParams
}

// ============================================================================
// 实现类
// ============================================================================

import { ConverterRegistryImpl } from './ConverterRegistry.class'
import { ConversionCacheImpl } from './ConversionCache.class'

export {
  ConverterRegistryImpl,
  ConversionCacheImpl
}

// ============================================================================
// 内置转换器
// ============================================================================

import { builtinConverters } from './converters/index'

export { builtinConverters }

// ============================================================================
// 工厂函数
// ============================================================================

import {
  createConverterRegistry,
  createConversionContext
} from './ConverterRegistry.factories.utils'

export {
  createConverterRegistry,
  createConversionContext
}

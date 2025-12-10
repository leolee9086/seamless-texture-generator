import type {  ComponentWrapperConfig, ValidationResult } from './types';
import {
  createEmptyComponentWrapperConfig,
  safeGetProperty,
  hasProperty,
  isRecord} from './core.guard';
import { VALIDATION_CONSTANTS } from './constants';
import { validatePropertyType } from './validatePropertyType.utils';

/**
 * 合并包装器配置
 * @param configs 要合并的配置数组
 * @returns 合并后的配置
 */
export function mergeWrapperConfigs<TProps, TEmit>(
  ...configs: ComponentWrapperConfig<TProps, TEmit>[]
): ComponentWrapperConfig<TProps, TEmit> {
  return configs.reduce((merged, config) => {
    // 合并props拦截器
    if (config.propsInterceptor) {
      merged.propsInterceptor = {
        ...merged.propsInterceptor,
        ...config.propsInterceptor,
        transform: {
          ...merged.propsInterceptor?.transform,
          ...config.propsInterceptor.transform
        },
        defaults: {
          ...merged.propsInterceptor?.defaults,
          ...config.propsInterceptor.defaults
        }
      };
    }

    // 合并emit拦截器
    if (config.emitInterceptor) {
      merged.emitInterceptor = {
        ...merged.emitInterceptor,
        ...config.emitInterceptor,
        transform: {
          ...merged.emitInterceptor?.transform,
          ...config.emitInterceptor.transform
        },
        map: {
          ...merged.emitInterceptor?.map,
          ...config.emitInterceptor.map
        }
      };
    }

    // 合并生命周期钩子
    if (config.hooks) {
      merged.hooks = {
        ...merged.hooks,
        ...config.hooks
      };
    }

    // 合并调试选项
    if (config.debug) {
      merged.debug = {
        ...merged.debug,
        ...config.debug
      };
    }

    return merged;
  }, createEmptyComponentWrapperConfig<TProps, TEmit>());
}

/**
 * 创建开发环境配置
 * @returns 开发环境配置
 */
export function createDevConfig<TProps, TEmit>(): ComponentWrapperConfig<TProps, TEmit> {
  return {
    debug: {
      enableLogging: true,
      enablePerformance: true,
      enableTypeChecking: true
    }
  };
}

/**
 * 创建生产环境配置
 * @returns 生产环境配置
 */
export function createProdConfig<TProps, TEmit>(): ComponentWrapperConfig<TProps, TEmit> {
  return {
    debug: {
      enableLogging: false,
      enablePerformance: false,
      enableTypeChecking: false
    }
  };
}

/**
 * 性能分析工具
 * @param fn 要分析的函数
 * @param iterations 迭代次数
 * @returns 性能分析结果
 */
export function analyzePerformance<T extends (...args: unknown[]) => unknown>(
  fn: T,
  iterations: number = 1000
): { averageTime: number; totalTime: number; iterations: number } {
  const startTime = performance.now();
  
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  
  const endTime = performance.now();
  const totalTime = endTime - startTime;
  const averageTime = totalTime / iterations;
  
  return {
    averageTime,
    totalTime,
    iterations
  };
}

/**
 * 验证对象属性的辅助函数
 * @param params 验证参数对象
 */
function validateObjectProperties(params: {
  config: unknown;
  configPath: string;
  propertyMap: Record<string, 'function' | 'object' | 'string' | 'boolean'>;
  errors: string[];
}): void {
  const { config, configPath, propertyMap, errors } = params;
  
  if (!isRecord(config)) return;

  for (const [property, expectedType] of Object.entries(propertyMap)) {
    if (hasProperty(config, property)) {
      const value = safeGetProperty<unknown>(config, property);
      const path = VALIDATION_CONSTANTS.STRING_GENERATORS.createPathProperty(configPath, property);
      validatePropertyType({
        obj: value,
        path,
        expectedType,
        errors
      });
    }
  }
}

/**
 * 验证props拦截器配置
 * @param config 配置对象
 * @param errors 错误数组
 */
function validatePropsInterceptor<TProps, TEmit>(
  config: ComponentWrapperConfig<TProps, TEmit>,
  errors: string[]
): void {
  if (!config.propsInterceptor) return;

  validateObjectProperties({
    config: config.propsInterceptor,
    configPath: VALIDATION_CONSTANTS.CONFIG_PATHS.PROPS_INTERCEPTOR,
    propertyMap: VALIDATION_CONSTANTS.PROPS_INTERCEPTOR_PROPERTIES,
    errors
  });
}

/**
 * 验证emit拦截器配置
 * @param config 配置对象
 * @param errors 错误数组
 */
function validateEmitInterceptor<TProps, TEmit>(
  config: ComponentWrapperConfig<TProps, TEmit>,
  errors: string[]
): void {
  if (!config.emitInterceptor) return;

  validateObjectProperties({
    config: config.emitInterceptor,
    configPath: VALIDATION_CONSTANTS.CONFIG_PATHS.EMIT_INTERCEPTOR,
    propertyMap: VALIDATION_CONSTANTS.EMIT_INTERCEPTOR_PROPERTIES,
    errors
  });
}

/**
 * 验证生命周期钩子配置
 * @param config 配置对象
 * @param errors 错误数组
 */
function validateLifecycleHooks<TProps, TEmit>(
  config: ComponentWrapperConfig<TProps, TEmit>,
  errors: string[]
): void {
  if (!config.hooks) return;

  validateObjectProperties({
    config: config.hooks,
    configPath: VALIDATION_CONSTANTS.CONFIG_PATHS.HOOKS,
    propertyMap: VALIDATION_CONSTANTS.LIFECYCLE_HOOKS_PROPERTIES,
    errors
  });
}

/**
 * 验证调试选项配置
 * @param config 配置对象
 * @param errors 错误数组
 */
function validateDebugOptions<TProps, TEmit>(
  config: ComponentWrapperConfig<TProps, TEmit>,
  errors: string[]
): void {
  if (!config.debug) return;

  validateObjectProperties({
    config: config.debug,
    configPath: VALIDATION_CONSTANTS.CONFIG_PATHS.DEBUG,
    propertyMap: VALIDATION_CONSTANTS.DEBUG_PROPERTIES,
    errors
  });
}

/**
 * 检查性能警告
 * @param config 配置对象
 * @param warnings 警告数组
 */
function checkPerformanceWarnings<TProps, TEmit>(
  config: ComponentWrapperConfig<TProps, TEmit>,
  warnings: string[]
): void {
  if (config.propsInterceptor?.intercept) {
    warnings.push(VALIDATION_CONSTANTS.PERFORMANCE_WARNINGS.PROPS_INTERCEPTOR);
  }
  
  if (config.emitInterceptor?.intercept) {
    warnings.push(VALIDATION_CONSTANTS.PERFORMANCE_WARNINGS.EMIT_INTERCEPTOR);
  }
}

/**
 * 验证包装器配置
 * @param config 包装器配置
 * @returns 验证结果
 */
export function validateWrapper<TProps, TEmit>(
  config: ComponentWrapperConfig<TProps, TEmit>
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 验证各个配置部分
  validatePropsInterceptor(config, errors);
  validateEmitInterceptor(config, errors);
  validateLifecycleHooks(config, errors);
  validateDebugOptions(config, errors);
  
  // 检查性能警告
  checkPerformanceWarnings(config, warnings);

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * 优化包装器配置
 * @param config 原始配置
 * @returns 优化后的配置
 */
export function optimizeWrapper<TProps, TEmit>(
  config: ComponentWrapperConfig<TProps, TEmit>
): ComponentWrapperConfig<TProps, TEmit> {
  const optimized = { ...config };
  
  // 如果同时有intercept和transform，优先使用transform
  if (optimized.propsInterceptor?.intercept && optimized.propsInterceptor?.transform) {
    console.warn('Both intercept and transform are configured for props. Consider using only transform for better performance.');
  }
  
  if (optimized.emitInterceptor?.intercept && optimized.emitInterceptor?.transform) {
    console.warn('Both intercept and transform are configured for emit. Consider using only transform for better performance.');
  }
  
  return optimized;
}
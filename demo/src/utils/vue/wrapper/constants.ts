/**
 * 组件包装器常量定义
 */

// 默认组件名称
export const DEFAULT_COMPONENT_NAME = 'Component';

// 日志前缀
export const LOG_PREFIX = '[ComponentWrapper]';

// 错误消息
export const ERROR_MESSAGES = {
  PROPS_VALIDATION_FAILED: 'Props validation failed',
  PROPS_TRANSFORMATION_ERROR: 'Props transformation error',
  EMIT_ERROR: 'Emit error',
  RENDER_ERROR: 'Render error',
  COMPONENT_RENDER_ERROR: 'Component render error'
} as const;

// 日志消息
export const LOG_MESSAGES = {
  PROPS_TRANSFORMED: 'Props transformed:',
  EVENT_INTERCEPTED: 'Event intercepted:',
  EVENT_EMITTED: 'Event emitted:',
  RENDER_TIME: 'Render time: {time}ms'
} as const;

// 事件名称
export const EVENT_NAMES = {
  UPDATE_MODEL_VALUE: 'update:modelValue'
} as const;

// CSS类名
export const CSS_CLASSES = {
  ERROR: 'error'
} as const;

// 性能监控
export const PERFORMANCE = {
  ENABLE: true,
  DISABLE: false
} as const;

// 字符串常量
export const STRING_CONSTANTS = {
  WRAPPED_PREFIX: `Wrapped`,
  ON_PREFIX: 'on',
  UPDATE_MODEL_VALUE_HANDLER: 'onUpdate:modelValue',
  COLON: ':',
  SPACE: ' ',
  DIV_TAG: 'div',
  TIME_PLACEHOLDER: '{time}',
  DOT: '.'
} as const;

// 字符串生成函数
export const STRING_GENERATORS = {
  /**
   * 生成包装组件名称
   * @param componentName 原始组件名称
   * @returns 包装后的组件名称
   */
  createWrappedComponentName: (componentName: string): string => {
    return STRING_CONSTANTS.WRAPPED_PREFIX + componentName;
  },
  
  /**
   * 生成事件处理器名称
   * @param eventName 事件名称
   * @returns 事件处理器名称
   */
  createEventHandlerName: (eventName: string): string => {
    return STRING_CONSTANTS.ON_PREFIX + eventName.charAt(0).toUpperCase() + eventName.slice(1);
  }
} as const;

// 验证相关常量
export const VALIDATION_CONSTANTS = {
  // 类型验证错误消息模板
  TYPE_ERROR_TEMPLATE: '{path} must be a {type}',
  
  // 性能警告消息
  PERFORMANCE_WARNINGS: {
    PROPS_INTERCEPTOR: 'Using propsInterceptor.intercept may impact performance. Consider using transform for specific props instead.',
    EMIT_INTERCEPTOR: 'Using emitInterceptor.intercept may impact performance. Consider using transform for specific events instead.'
  },
  
  // 配置路径
  CONFIG_PATHS: {
    PROPS_INTERCEPTOR: 'propsInterceptor',
    EMIT_INTERCEPTOR: 'emitInterceptor',
    HOOKS: 'hooks',
    DEBUG: 'debug'
  },
  
  // 属性类型
  PROPERTY_TYPES: {
    FUNCTION: 'function',
    OBJECT: 'object',
    STRING: 'string',
    BOOLEAN: 'boolean'
  } as const,
  
  // Props拦截器属性映射
  PROPS_INTERCEPTOR_PROPERTIES: {
    intercept: 'function',
    transform: 'object',
    defaults: 'object',
    validate: 'function'
  } as const,
  
  // Emit拦截器属性映射
  EMIT_INTERCEPTOR_PROPERTIES: {
    intercept: 'function',
    transform: 'object',
    prefix: 'string',
    suffix: 'string',
    map: 'object'
  } as const,
  
  // 生命周期钩子属性映射
  LIFECYCLE_HOOKS_PROPERTIES: {
    beforeMount: 'function',
    afterMount: 'function',
    beforeUnmount: 'function',
    beforeUpdate: 'function',
    afterUpdate: 'function'
  } as const,
  
  // 调试选项属性映射
  DEBUG_PROPERTIES: {
    enableLogging: 'boolean',
    enablePerformance: 'boolean',
    enableTypeChecking: 'boolean'
  } as const,
  
  // 字符串模板
  TEMPLATES: {
    PATH_PROPERTY: '{path}.{property}',
    PATH_PLACEHOLDER: '{path}',
    TYPE_PLACEHOLDER: '{type}',
    PROPERTY_PLACEHOLDER: '{property}'
  } as const,
  
  // 字符串生成函数
  STRING_GENERATORS: {
    /**
     * 生成路径属性字符串
     * @param path 路径
     * @param property 属性
     * @returns 路径属性字符串
     */
    createPathProperty: (path: string, property: string): string => {
      return `${path}${STRING_CONSTANTS.DOT}${property}`;
    },
    
    /**
     * 生成类型错误消息
     * @param path 路径
     * @param type 类型
     * @returns 错误消息
     */
    createTypeErrorMessage: (path: string, type: string): string => {
      return VALIDATION_CONSTANTS.TYPE_ERROR_TEMPLATE
        .replace(VALIDATION_CONSTANTS.TEMPLATES.PATH_PLACEHOLDER, path)
        .replace(VALIDATION_CONSTANTS.TEMPLATES.TYPE_PLACEHOLDER, type);
    }
  } as const
} as const;
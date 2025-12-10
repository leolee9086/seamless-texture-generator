import { isValidEmitKey, isFunction } from './core.guard';

/**
 * 创建emit转换器
 * @param transformers 转换器配置
 * @returns emit转换函数
 */

export function createEmitTransformer<TEmit>(
  transformers: {
    [K in keyof TEmit]?: (...args: unknown[]) => unknown[];
  }
): (eventName: string, ...args: unknown[]) => [string, ...unknown[]] {
  return (eventName: string, ...args: unknown[]) => {
    // 使用类型守卫替代as断言
    if (isValidEmitKey<TEmit>(eventName) && transformers[eventName]&&isFunction(transformers[eventName])) {
      const transformer = transformers[eventName];
      // 合并条件判断，避免嵌套if
        return [eventName, ...transformer(...args)];
      
    }
    return [eventName, ...args];
  };
}

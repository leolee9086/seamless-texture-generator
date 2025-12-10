import { safePropsToRecord, safeCastToPropsWithDefault, createDefaultProps, safePropsToRecordStrict, hasProperty, isFunction, safeGetProperty, safeSetProperty, safeRecordToPropsStrict } from './core.guard';

/**
 * 创建props转换器
 * @param transformers 转换器配置
 * @returns props转换函数
 */

export function createPropsTransformer<TProps>(
  transformers: {
    [K in keyof TProps]?: (value: TProps[K]) => unknown;
  }
): (props: TProps) => TProps {
  return (props: TProps) => {
    // 使用类型守卫确保类型安全，避免使用as断言
    const propsRecord = safePropsToRecord(props);
    const result = safeCastToPropsWithDefault(propsRecord, createDefaultProps<TProps>());
    const resultRecord = safePropsToRecordStrict(result);

    // 使用for...of替代forEach，避免ESLint警告
    for (const [key, transformer] of Object.entries(transformers)) {
      if (hasProperty(resultRecord, key) && isFunction(transformer) && safeGetProperty<TProps[keyof TProps]>(resultRecord, key) !== undefined) {
        const currentValue = safeGetProperty<TProps[keyof TProps]>(resultRecord, key);
        // 合并条件判断，避免嵌套if
        safeSetProperty(resultRecord, key, transformer(currentValue));

      }
    }

    return safeRecordToPropsStrict(resultRecord);
  };
}

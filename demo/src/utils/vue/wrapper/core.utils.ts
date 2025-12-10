import {
  defineComponent,
  computed,
  h,
  markRaw,
  onMounted,
  onBeforeUnmount,
  onBeforeUpdate,
  onUpdated,
  type ComputedRef
} from './imports';
import type { VueComponent, ComponentWrapperConfig, RenderFunctionParams } from './types';
import { LOG_PREFIX, ERROR_MESSAGES, LOG_MESSAGES, EVENT_NAMES, CSS_CLASSES, STRING_CONSTANTS, STRING_GENERATORS } from './constants';
import {
  isArray,
  isValidationErrorMessage,
  isEventTransformer,
  isPropsTransformer,
  getSafeEmits,
  isValidTransformMap,
  getSafeTransformValue,
  isValidCacheKeyMatch,
  safeCastToProps,
  safeCastToPropsWithDefault,
  createDefaultProps
} from './core.guard';

// 缓存Map，用于存储转换结果
const transformCache = new WeakMap<object, { key: string; value: Record<string, unknown> }>();

/**
 * 获取组件名称
 */
// 保留函数以备将来使用
// function getComponentName(component: VueComponent): string {
//   if (hasName(component) && component.name) {
//     return component.name;
//   }
//   return DEFAULT_COMPONENT_NAME;
// }

/**
 * 获取组件属性
 */
// 保留函数以备将来使用
// function getComponentProps(component: VueComponent): Record<string, unknown> {
//   return getSafeProps(component);
// }

/**
 * 获取组件事件
 */
function getComponentEmits(component: VueComponent): Record<string, unknown> | string[] {
  return getSafeEmits(component);
}

/**
 * 应用默认值到props
 */
function applyDefaults<TProps>(
  result: Record<string, unknown>, 
  defaults?: Partial<TProps>
): Record<string, unknown> {
  if (!defaults) {
    return result;
  }
  return { ...defaults, ...result };
}

/**
 * 应用转换器到props
 */
function applyTransformers<TProps>(
  result: Record<string, unknown>, 
  transform?: { [K in keyof TProps]?: (value: TProps[K]) => unknown }
): Record<string, unknown> {
  if (!transform) {
    return result;
  }

  for (const [key, transformer] of Object.entries(transform)) {
    if (key in result && isPropsTransformer(transformer)) {
      result[key] = transformer(result[key]);
    }
  }
  
  return result;
}

/**
 * 应用拦截器到props
 */
function applyInterceptor<TProps>(
  result: Record<string, unknown>,
  intercept?: (props: TProps) => Partial<TProps>
): Record<string, unknown> {
  if (!intercept) {
    return result;
  }
  // 使用类型守卫确保类型安全
  const castedProps = safeCastToProps<TProps>(result);
  if (castedProps) {
    const intercepted = intercept(castedProps);
    return { ...result, ...intercepted };
  }
  return result;
}

/**
 * 验证props
 */
function validateProps<TProps>(
  props: TProps, 
  validate?: (props: TProps) => boolean | string
): void {
  if (!validate) {
    return;
  }

  const validationResult = validate(props);
  if (validationResult === false) {
    console.warn(LOG_PREFIX+ERROR_MESSAGES.PROPS_VALIDATION_FAILED);
    return;
  }
  
  if (isValidationErrorMessage(validationResult)) {
    console.warn(LOG_PREFIX+ERROR_MESSAGES.PROPS_VALIDATION_FAILED+STRING_CONSTANTS.COLON, validationResult);
  }
}

/**
 * 应用事件前缀/后缀
 */
function applyEventPrefixSuffix(
  eventName: string, 
  prefix?: string, 
  suffix?: string
): string {
  let finalEventName = eventName;
  if (prefix) {
    finalEventName = prefix + eventName;
  }
  if (suffix) {
    finalEventName = eventName + suffix;
  }
  return finalEventName;
}

/**
 * 应用事件映射
 */
function applyEventMapping<TEmit>(
  eventName: string,
  map?: { [K in keyof TEmit]?: string }
): string {
  if (!map || !isValidTransformMap(map)) {
    return eventName;
  }
  return getSafeTransformValue<string>(map, eventName) || eventName;
}

/**
 * 应用事件转换器
 */
function applyEventTransformer<TEmit>(
  eventName: string,
  args: unknown[],
  transform?: { [K in keyof TEmit]?: (...args: unknown[]) => unknown[] }
): unknown[] {
  if (!transform || !isValidTransformMap(transform)) {
    return args;
  }
  
  const transformer = getSafeTransformValue<(...args: unknown[]) => unknown[]>(transform, eventName);
  if (isEventTransformer(transformer)) {
    return transformer(...args);
  }
  
  return args;
}

/**
 * 创建事件处理器
 */
function createEventHandlers(
  componentEmits: Record<string, unknown> | string[],
  proxyEmit: (eventName: string, ...args: unknown[]) => void
): Record<string, (...args: unknown[]) => void> {
  const emitList = isArray(componentEmits) ? componentEmits : Object.keys(componentEmits);
  
  const result: Record<string, (...args: unknown[]) => void> = {};
  
  for (const eventName of emitList) {
    const handlerPropName = STRING_GENERATORS.createEventHandlerName(eventName);
    result[handlerPropName] = (...args: unknown[]): void => proxyEmit(eventName, ...args);
  }
  
  return result;
}

/**
 * 创建转换后的props计算属性
 */
function createTransformedProps<TProps>(
  props: Record<string, unknown>,
  propsInterceptor?: ComponentWrapperConfig<TProps>['propsInterceptor'],
  debug?: ComponentWrapperConfig<TProps>['debug']
): ComputedRef<Record<string, unknown>> {
  return computed(() => {
    const cacheKey = JSON.stringify(props);
    
    // 检查缓存
    const cached = transformCache.has(props) ? transformCache.get(props) : null;
    if (cached && isValidCacheKeyMatch(cached, cacheKey)) {
      return cached.value;
    }
    
    let result = { ...props };
    
    try {
      // 应用默认值
      result = applyDefaults(result, propsInterceptor?.defaults);
      
      // 应用转换器
      result = applyTransformers(result, propsInterceptor?.transform);
      
      // 应用拦截器
      result = applyInterceptor(result, propsInterceptor?.intercept);
      
      // 验证props
      const castedProps = safeCastToProps<TProps>(result);
      if (castedProps) {
        validateProps(castedProps, propsInterceptor?.validate);
      }
      
      // 缓存结果
      transformCache.set(props, { key: cacheKey, value: result });
      
      // 调试日志
      if (debug?.enableLogging) {
        console.warn(LOG_PREFIX + STRING_CONSTANTS.SPACE + LOG_MESSAGES.PROPS_TRANSFORMED, { original: props, transformed: result });
      }
      
      return result;
    } catch (error) {
      console.error(LOG_PREFIX + STRING_CONSTANTS.SPACE + ERROR_MESSAGES.PROPS_TRANSFORMATION_ERROR + STRING_CONSTANTS.COLON, error);
      return props;
    }
  });
}

/**
 * 创建代理emit函数
 */
function createProxyEmit<TEmit>(
  emit: (event: string, ...args: unknown[]) => void,
  emitInterceptor?: ComponentWrapperConfig<unknown, TEmit>['emitInterceptor'],
  debug?: ComponentWrapperConfig<unknown, TEmit>['debug']
) {
  return (eventName: string, ...args: unknown[]): void => {
    try {
      // 应用前缀/后缀
      let finalEventName = applyEventPrefixSuffix(
        eventName, 
        emitInterceptor?.prefix, 
        emitInterceptor?.suffix
      );
      
      // 应用事件映射
      finalEventName = applyEventMapping(finalEventName, emitInterceptor?.map);
      
      // 应用拦截器
      if (!emitInterceptor?.intercept) {
        // 继续执行后续逻辑
      }
      
      const shouldEmit = emitInterceptor?.intercept ? emitInterceptor.intercept(eventName, ...args) : true;
      if (!shouldEmit) {
        debug?.enableLogging && console.warn(LOG_PREFIX + STRING_CONSTANTS.SPACE + LOG_MESSAGES.EVENT_INTERCEPTED, eventName);
        return;
      }
      
      // 应用转换器
      const finalArgs = applyEventTransformer(finalEventName, args, emitInterceptor?.transform);
      
      // 调试日志
      if (debug?.enableLogging) {
        console.warn(LOG_PREFIX + STRING_CONSTANTS.SPACE + LOG_MESSAGES.EVENT_EMITTED, {
          original: eventName,
          final: finalEventName,
          args: finalArgs
        });
      }

      // 触发原始emit
      emit(finalEventName, ...finalArgs);
    } catch (error) {
      console.error(LOG_PREFIX + STRING_CONSTANTS.SPACE + ERROR_MESSAGES.EMIT_ERROR + STRING_CONSTANTS.COLON, error);
    }
  };
}

/**
 * 设置生命周期钩子
 */
function setupLifecycleHooks<TProps>(
  hooks: ComponentWrapperConfig<TProps>['hooks'],
  transformedProps: { value: TProps }
): void {
  if (hooks?.beforeMount) {
    hooks.beforeMount(transformedProps.value);
  }

  onMounted(() => {
    if (hooks?.afterMount) {
      hooks.afterMount(transformedProps.value);
    }
  });

  onBeforeUnmount(() => {
    if (hooks?.beforeUnmount) {
      hooks.beforeUnmount();
    }
  });

  onBeforeUpdate(() => {
    if (hooks?.beforeUpdate) {
      hooks.beforeUpdate(transformedProps.value);
    }
  });

  onUpdated(() => {
    if (hooks?.afterUpdate) {
      hooks.afterUpdate(transformedProps.value);
    }
  });
}

/**
 * 创建渲染函数
 */
function createRenderFunction<TProps, TEmit>(
  params: RenderFunctionParams<TProps, TEmit>
): () => unknown {
  return (): unknown => {
    const startTime = params.debug?.enablePerformance ? performance.now() : 0;
    
    try {
      // 创建事件处理器
      const eventHandlers = createEventHandlers(params.componentEmits, params.proxyEmit);
      
      // 手动添加 v-model 的事件处理器,确保它总是被捕获
      eventHandlers[STRING_CONSTANTS.UPDATE_MODEL_VALUE_HANDLER] = (...args: unknown[]): void => params.proxyEmit(EVENT_NAMES.UPDATE_MODEL_VALUE, ...args);

      const result = h(params.component, {
        ...params.transformedProps.value,
        ...eventHandlers
      });
      
      if (params.debug?.enablePerformance) {
        const endTime = performance.now();
        console.warn(LOG_PREFIX + STRING_CONSTANTS.SPACE + LOG_MESSAGES.RENDER_TIME.replace(STRING_CONSTANTS.TIME_PLACEHOLDER, String(endTime - startTime)));
      }
      
      return result;
    } catch (error) {
      console.error(LOG_PREFIX + STRING_CONSTANTS.SPACE + ERROR_MESSAGES.RENDER_ERROR + STRING_CONSTANTS.COLON, error);
      return h(STRING_CONSTANTS.DIV_TAG, { class: CSS_CLASSES.ERROR }, ERROR_MESSAGES.COMPONENT_RENDER_ERROR);
    }
  };
}

/**
 * 创建组件包装器
 * @param component 要包装的Vue组件
 * @param config 包装器配置
 * @returns 包装后的Vue组件
 */
export function createComponentWrapper<TProps = unknown, TEmit = unknown>(
  component: VueComponent,
  config: ComponentWrapperConfig<TProps, TEmit> = {}
): VueComponent {
  const {
    propsInterceptor,
    emitInterceptor,
    hooks,
    debug
  } = config;

  // 获取组件信息
  const componentEmits = getComponentEmits(component);

  // 创建包装后的组件
  const WrappedComponent = defineComponent({
    setup(props: Record<string, unknown>, { emit }: { emit: (event: string, ...args: unknown[]) => void }) {
      // 创建响应式的转换后props，带缓存
      const transformedProps = createTransformedProps(props, propsInterceptor, debug);

      // 创建代理emit函数
      const proxyEmit = createProxyEmit(emit, emitInterceptor, debug);

      // 设置生命周期钩子
      const defaultProps = createDefaultProps<TProps>();
      const finalProps = safeCastToPropsWithDefault<TProps>(transformedProps.value, defaultProps);
      
      // 如果类型转换失败，记录警告
      if (!safeCastToProps<TProps>(transformedProps.value)) {
        console.warn(LOG_PREFIX + ERROR_MESSAGES.PROPS_VALIDATION_FAILED, 'Failed to cast props to expected type');
      }
      
      setupLifecycleHooks(hooks, { value: finalProps });

      // 创建渲染函数
      const renderFunction = createRenderFunction({
        component,
        componentEmits,
        transformedProps,
        proxyEmit,
        debug
      });

      return renderFunction;
    }
  });

  // 标记为原始对象，避免响应式包装
  return markRaw(WrappedComponent);
}
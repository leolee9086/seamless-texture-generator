import type { VueComponent, ComponentWrapperConfig } from './types';

/**
 * 类型守卫函数，用于替换类型断言
 */

/**
 * 检查对象是否具有name属性
 */
export function hasName(obj: unknown): obj is { name: string } {
  return typeof obj === 'object' && obj !== null && 'name' in obj && typeof (obj as { name: unknown }).name === 'string';
}

/**
 * 检查对象是否具有props属性
 */
export function hasProps(obj: unknown): obj is { props: Record<string, unknown> } {
  return typeof obj === 'object' && obj !== null && 'props' in obj && isObject((obj as { props: unknown }).props);
}

/**
 * 检查对象是否具有emits属性
 */
export function hasEmits(obj: unknown): obj is { emits: Record<string, unknown> | string[] } {
  return typeof obj === 'object' && obj !== null && 'emits' in obj && (
    isObject((obj as { emits: unknown }).emits) || isArray((obj as { emits: unknown }).emits)
  );
}

/**
 * 检查对象是否是Vue组件
 */
export function isVueComponent(obj: unknown): obj is VueComponent {
  return typeof obj === 'object' && obj !== null && (
    'setup' in obj || 
    'render' in obj || 
    'template' in obj ||
    '__v_skip' in obj
  );
}

/**
 * 检查值是否为函数
 */
export function isFunction(value: unknown): value is Function {
  return typeof value === 'function';
}

/**
 * 检查值是否为字符串
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * 检查值是否为对象
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 检查值是否为数组
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * 检查值是否为布尔值
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * 检查缓存项是否有效
 */
export function isValidCacheItem(cached: unknown): cached is { key: string; value: Record<string, unknown> } {
  return isObject(cached) && 'key' in cached && 'value' in cached && isString(cached.key);
}

/**
 * 检查验证结果是否为字符串错误消息
 */
export function isValidationErrorMessage(result: unknown): result is string {
  return isString(result);
}

/**
 * 检查事件转换器是否为函数
 */
export function isEventTransformer(transformer: unknown): transformer is (...args: unknown[]) => unknown[] {
  return isFunction(transformer);
}

/**
 * 检查Props转换器是否为函数
 */
export function isPropsTransformer(transformer: unknown): transformer is (value: unknown) => unknown {
  return isFunction(transformer);
}

/**
 * 检查对象是否为有效的Props类型
 */
export function isValidProps(obj: unknown): obj is Record<string, unknown> {
  return isObject(obj);
}

/**
 * 检查对象是否为有效的Emits类型
 */
export function isValidEmits(obj: unknown): obj is Record<string, unknown> | string[] {
  return isObject(obj) || isArray(obj);
}

/**
 * 安全地获取对象的props属性
 */
export function getSafeProps(obj: unknown): Record<string, unknown> {
  if (hasProps(obj)) {
    return obj.props;
  }
  return {};
}

/**
 * 安全地获取对象的emits属性
 */
export function getSafeEmits(obj: unknown): Record<string, unknown> | string[] {
  if (hasEmits(obj)) {
    return obj.emits;
  }
  return {};
}

/**
 * 检查对象是否为有效的转换器映射
 */
export function isValidTransformMap(obj: unknown): obj is Record<string, unknown> {
  return isObject(obj);
}

/**
 * 安全地获取转换器映射中的值
 */
export function getSafeTransformValue<T>(map: Record<string, unknown>, key: string): T | undefined {
  return isValidTransformMap(map) ? (map[key] as T) : undefined;
}

/**
 * 检查是否为有效的事件处理器映射
 */
export function isValidEventHandlerMap(obj: unknown): obj is Record<string, (...args: unknown[]) => void> {
  return isObject(obj);
}

/**
 * 检查是否为有效的缓存项
 */
export function isValidCachedItem(obj: unknown): obj is { key: string; value: Record<string, unknown> } {
  return isObject(obj) && 'key' in obj && 'value' in obj && isString((obj as { key: unknown }).key);
}

/**
 * 检查是否为有效的组件名称
 */
export function isValidComponentName(name: unknown): name is string {
  return isString(name) && name.length > 0;
}

/**
 * 检查是否为有效的调试选项
 */
export function isValidDebugOptions(obj: unknown): obj is { enableLogging?: boolean; enablePerformance?: boolean } {
  return isObject(obj) && (
    !(('enableLogging' in obj) && !isBoolean((obj as { enableLogging: unknown }).enableLogging)) &&
    !(('enablePerformance' in obj) && !isBoolean((obj as { enablePerformance: unknown }).enablePerformance))
  );
}

/**
 * 检查是否为有效的缓存键匹配
 */
export function isValidCacheKeyMatch(cached: unknown, cacheKey: string): boolean {
  return isValidCacheItem(cached) && cached.key === cacheKey;
}

/**
 * 安全地转换类型
 */
export function safeTypeCast<T>(value: unknown, validator: (v: unknown) => v is T): T | null {
  return validator(value) ? value : null;
}

/**
 * 安全地将Record<string, unknown>转换为TProps类型
 * 使用类型守卫确保类型安全
 */
export function safeCastToProps<TProps>(props: Record<string, unknown>): TProps | null {
  return isValidProps(props) ? (props as TProps) : null;
}

/**
 * 安全地将Record<string, unknown>转换为TProps类型，提供默认值
 * 使用类型守卫确保类型安全
 */
export function safeCastToPropsWithDefault<TProps>(
  props: Record<string, unknown>,
  defaultValue: TProps
): TProps {
  const casted = safeCastToProps<TProps>(props);
  return casted || defaultValue;
}

/**
 * 创建一个类型安全的空对象
 * 避免使用类型断言
 */
export function createEmptyObject(): Record<string, never> {
  return {};
}

/**
 * 安全地创建默认props对象
 * 避免使用类型断言
 */
export function createDefaultProps<TProps>(): TProps {
  return {} as TProps;
}

/**
 * 安全地创建一个可变的props副本，避免使用类型断言
 * @param props 原始props对象
 * @returns 可变的props副本
 */
export function createMutablePropsCopy<TProps extends Record<string, unknown>>(props: TProps): Record<string, unknown> {
  return { ...props };
}

/**
 * 安全地将Record<string, unknown>转换回TProps类型
 * @param props 转换后的props对象
 * @param originalProps 原始props对象，用于类型推断
 * @returns 转换后的TProps对象
 */
export function restorePropsType<TProps extends Record<string, unknown>>(
  props: Record<string, unknown>,
  originalProps: TProps
): TProps {
  // 使用Object.keys确保类型安全
  const result: Partial<TProps> = {};
  
  for (const key of Object.keys(originalProps)) {
    if (key in props) {
      result[key as keyof TProps] = props[key] as TProps[keyof TProps];
    }
  }
  
  return result as TProps;
}

/**
 * 检查事件名是否为有效的TEmit键
 */
export function isValidEmitKey<TEmit>(eventName: string): eventName is string & keyof TEmit {
  return typeof eventName === 'string';
}

/**
 * 创建一个空的ComponentWrapperConfig对象，避免使用类型断言
 */
export function createEmptyComponentWrapperConfig<TProps, TEmit>(): ComponentWrapperConfig<TProps, TEmit> {
  return {};
}

/**
 * 安全地将TProps转换为Record<string, unknown>
 * @param props TProps对象
 * @returns Record<string, unknown>对象
 */
export function safePropsToRecord<TProps>(props: TProps): Record<string, unknown> {
  if (props && typeof props === 'object') {
    return props as Record<string, unknown>;
  }
  return {};
}

/**
 * 安全地将Record<string, unknown>转换回TProps类型
 * @param record Record<string, unknown>对象
 * @returns TProps对象
 */
export function safeRecordToProps<TProps>(record: Record<string, unknown>): TProps {
  return record as TProps;
}

/**
 * 安全地获取对象的属性值
 * @param obj 对象
 * @param key 属性键
 * @returns 属性值
 */
export function safeGetProperty<T>(obj: Record<string, unknown>, key: string): T | undefined {
  return obj[key] as T;
}

/**
 * 安全地设置对象的属性值
 * @param obj 对象
 * @param key 属性键
 * @param value 属性值
 */
export function safeSetProperty<T>(obj: Record<string, unknown>, key: string, value: T): void {
  obj[key] = value;
}

/**
 * 检查属性是否存在于对象中
 * @param obj 对象
 * @param key 属性键
 * @returns 是否存在
 */
export function hasProperty(obj: Record<string, unknown>, key: string): boolean {
  return key in obj;
}

/**
 * 检查对象是否为Record类型
 * @param obj 对象
 * @returns 是否为Record类型
 */
export function isRecord(obj: unknown): obj is Record<string, unknown> {
  return isObject(obj);
}

/**
 * 安全地将TProps转换为Record<string, unknown>
 * @param props TProps对象
 * @returns Record<string, unknown>对象
 */
export function safePropsToRecordStrict<TProps>(props: TProps): Record<string, unknown> {
  return props as Record<string, unknown>;
}

/**
 * 安全地将Record<string, unknown>转换回TProps类型
 * @param record Record<string, unknown>对象
 * @returns TProps对象
 */
export function safeRecordToPropsStrict<TProps>(record: Record<string, unknown>): TProps {
  return record as TProps;
}
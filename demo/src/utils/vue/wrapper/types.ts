import type { Component, DefineComponent, ComputedOptions, MethodOptions, ComponentOptionsMixin, EmitsOptions } from 'vue';

// 基础类型定义 - 只包含组件定义，不包含实例
export type VueComponent = DefineComponent<unknown, unknown, unknown> | Component;

// 获取组件名称的类型辅助函数
export type ComponentName<T> = T extends { name?: string } ? T['name'] : string;

// 获取组件props的类型辅助函数
export type ComponentProps<T> = T extends { props?: unknown } ? T['props'] : unknown;

// 获取组件emits的类型辅助函数
export type ComponentEmits<T> = T extends { emits?: unknown } ? T['emits'] : unknown;

// Props类型推导
export type InferProps<T> = T extends DefineComponent<infer P, unknown, unknown> ? P : unknown;

// Emit类型推导 - 改进版本
export type InferEmit<T> = T extends DefineComponent<unknown, unknown, unknown, ComputedOptions, MethodOptions, ComponentOptionsMixin, ComponentOptionsMixin, infer E extends EmitsOptions>
  ? E
  : T extends { emits?: infer E extends EmitsOptions }
    ? E
    : unknown;

// 包装器类型
export type ComponentWrapper = (component: VueComponent) => VueComponent;

// Props拦截器配置
export interface PropsInterceptorConfig<TProps = unknown> {
  // 拦截并修改props
  intercept?: (props: TProps, forceUpdate?: (updatedProps?: Partial<TProps>) => void) => Partial<TProps>;
  
  // 转换特定prop的值
  transform?: {
    [K in keyof TProps]?: (value: TProps[K]) => unknown;
  };
  
  // 设置默认值
  defaults?: Partial<TProps>;
  
  // 验证props
  validate?: (props: TProps) => boolean | string;
}

// Emit拦截器配置
export interface EmitInterceptorConfig<TEmit = unknown> {
  // 拦截事件
  intercept?: (eventName: string, ...args: unknown[]) => boolean;
  
  // 转换事件参数
  transform?: {
    [K in keyof TEmit]?: (...args: unknown[]) => unknown[];
  };
  
  // 事件名称前缀
  prefix?: string;
  
  // 事件名称后缀
  suffix?: string;
  
  // 事件映射
  map?: {
    [K in keyof TEmit]?: string;
  };
}

// 生命周期钩子
export interface LifecycleHooks<TProps = unknown> {
  beforeMount?: (props: TProps) => void;
  afterMount?: (props: TProps) => void;
  beforeUnmount?: () => void;
  beforeUpdate?: (props: TProps) => void;
  afterUpdate?: (props: TProps) => void;
}

// 调试选项
export interface DebugOptions {
  enableLogging?: boolean;
  enablePerformance?: boolean;
  enableTypeChecking?: boolean;
}

// 主配置接口
export interface ComponentWrapperConfig<TProps = unknown, TEmit = unknown> {
  // Props拦截器配置
  propsInterceptor?: PropsInterceptorConfig<TProps>;
  
  // Emit拦截器配置
  emitInterceptor?: EmitInterceptorConfig<TEmit>;
  
  // 生命周期钩子
  hooks?: LifecycleHooks<TProps>;
  
  // 调试选项
  debug?: DebugOptions;
}

// 转换后的Props类型 - 改进版本
export type TransformedProps<TProps, TTransform> = {
  [K in keyof TProps]: K extends keyof TTransform 
    ? TTransform[K] extends (...args: unknown[]) => infer R
      ? R
      : TProps[K]
    : TProps[K];
};

// 转换后的Emit类型 - 改进版本
export type TransformedEmit<TEmit, TTransform> = {
  [K in keyof TEmit]: K extends keyof TTransform
    ? TTransform[K] extends (...args: unknown[]) => unknown[]
      ? TEmit[K] extends (...args: unknown[]) => unknown
        ? (...args: Parameters<TEmit[K]>) => ReturnType<TEmit[K]>
        : TEmit[K]
      : TEmit[K]
    : TEmit[K];
};

// 高级类型工具
export type If<T extends boolean, A, B> = T extends true ? A : B;

export type Extract<T, U> = T extends U ? T : never;

export type Exclude<T, U> = T extends U ? never : T;

export type MapProps<T, F> = {
  [K in keyof T]: F extends (value: T[K]) => infer R ? R : T[K];
};

export type MapEmits<T, F> = {
  [K in keyof T]: F extends (...args: unknown[]) => infer R ? R : T[K];
};

export type ValidateProps<T> = T extends Record<string, unknown> ? T : never;

export type ValidateEmits<T> = T extends Record<string, unknown> ? T : never;

// 测试相关类型 - 移除jest依赖
export interface TestWrapperOptions<TProps = unknown> {
  mockProps?: Partial<TProps>;
  mockEmit?: (...args: unknown[]) => void;
  spyOn?: boolean;
}

export interface TestWrapperResult {
  wrapper: VueComponent;
  propsSpy: (...args: unknown[]) => void;
  emitSpy: (...args: unknown[]) => void;
}

// 性能测试结果
export interface PerformanceResult {
  averageRenderTime: number;
  memoryUsage: number;
  propsTransformTime: number;
  emitTransformTime: number;
}

// 验证结果
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// 渲染函数参数接口
export interface RenderFunctionParams<TProps, TEmit> {
  component: VueComponent;
  componentEmits: Record<string, unknown> | string[];
  transformedProps: { value: TProps };
  proxyEmit: (eventName: string, ...args: unknown[]) => void;
  debug?: ComponentWrapperConfig<TProps, TEmit>['debug'];
}

// 组件IO接口
export interface ComponentIo {
  name?: string;
  props?: Record<string, unknown>;
  emits?: Record<string, unknown> | string[];
}
/**
 * Vue 相关导入转发文件
 * 用于转发 Vue 相关的类型和函数，避免直接导入
 */

// Vue 类型导入
export type { 
  Component, 
  DefineComponent, 
  PropType, 
  ComputedRef, 
  Ref, 
  App, 
  Plugin, 
  Directive, 
  InjectionKey,
  VNode,
  RendererElement,
  RendererNode,
  SetupContext
} from 'vue';

// Vue 函数导入
export { 
  defineComponent, 
  computed, 
  ref, 
  reactive, 
  toRefs, 
  watch, 
  watchEffect, 
  onMounted, 
  onBeforeMount, 
  onUpdated, 
  onBeforeUpdate, 
  onUnmounted, 
  onBeforeUnmount, 
  onErrorCaptured, 
  onRenderTracked, 
  onRenderTriggered,
  provide, 
  inject, 
  h, 
  markRaw, 
  toRaw, 
  isRef, 
  unref, 
  toRef, 
  shallowRef, 
  shallowReactive, 
  readonly, 
  isReadonly, 
  isReactive, 
  isShallow, 
  triggerRef, 
  customRef, 
  nextTick, 
  defineAsyncComponent,
  defineExpose,
  withDefaults,
  getCurrentInstance,
  useSlots,
  useAttrs,
  useModel,
  createApp
} from 'vue';
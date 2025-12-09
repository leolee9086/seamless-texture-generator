/**
 * WebGPU 相关类型守卫
 * 用于替代类型断言，遵循架构规范
 */

import { WebGPUCache, WebGPUWindow } from './webgpu.types';

/**
 * 检查对象是否为有效的 WebGPU 缓存
 * @param obj 要检查的对象
 * @returns 是否为有效的 WebGPU 缓存
 */
export const isWebGPUCache = (obj: unknown): obj is WebGPUCache => {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }
  
  const cache = obj as Record<string, unknown>;
  return (
    (cache.设备 === null || cache.设备 instanceof GPUDevice) &&
    (cache.适配器 === null || cache.适配器 instanceof GPUAdapter)
  );
};

/**
 * 获取全局 WebGPU 缓存对象
 * @param windowObj window 对象
 * @param cacheKey 缓存键
 * @returns WebGPU 缓存对象
 */
export const getWebGPUCache = (windowObj: Window, cacheKey: symbol): WebGPUCache => {
  const webgpuWindow = windowObj as WebGPUWindow;
  
  if (!webgpuWindow[cacheKey]) {
    webgpuWindow[cacheKey] = {
      设备: null,
      适配器: null
    };
  }
  
  return webgpuWindow[cacheKey];
};
/**
 * WebGPU 相关类型定义
 */

/**
 * WebGPU 缓存接口定义
 */
export interface WebGPUCache {
  设备: GPUDevice | null;
  适配器: GPUAdapter | null;
}

/**
 * 扩展 Window 接口以包含 WebGPU 缓存
 */
export interface WebGPUWindow extends Window {
  [key: symbol]: WebGPUCache;
}
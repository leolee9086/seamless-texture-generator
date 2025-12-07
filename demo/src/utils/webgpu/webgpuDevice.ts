/// <reference types="@webgpu/types" />

// WebGPU 设备和适配器全局缓存
const WEBGPU缓存键 = Symbol.for('webgpu_cache');

/**
 * 初始化 WebGPU 并返回一个 GPUDevice 实例。
 * 该函数采用单例模式，确保只初始化一次设备。
 * @returns {Promise<GPUDevice>} GPUDevice 实例
 * @throws {Error} 如果 WebGPU 不受支持或无法获取适配器/设备
 */
export const 获取WebGPU设备 = async (): Promise<GPUDevice> => {
  // 初始化全局缓存
  const 全局缓存 = window as unknown as Record<symbol, { 设备: GPUDevice | null; 适配器: GPUAdapter | null }>;

  if (!全局缓存[WEBGPU缓存键]) {
    全局缓存[WEBGPU缓存键] = {
      设备: null,
      适配器: null
    };
  }

  const 缓存 = 全局缓存[WEBGPU缓存键];

  if (缓存.设备) {
    return 缓存.设备;
  }

  if (!navigator.gpu) {
    throw new Error('WebGPU 不受支持');
  }

  缓存.适配器 = await navigator.gpu.requestAdapter();
  if (!缓存.适配器) {
    throw new Error('无法获取 WebGPU 适配器');
  }

  // 获取适配器限制信息
  const 适配器限制 = 缓存.适配器.limits;
  
  // 计算所需的存储缓冲区大小限制
  // 根据错误信息，我们需要至少201326592字节（约192MB）的缓冲区
  // 但为了安全性和未来扩展，我们请求适配器支持的最大值
  const 所需存储缓冲区限制 = Math.min(
    适配器限制.maxStorageBufferBindingSize || 134217728, // 默认128MB
    2147483644 // 错误信息中提到的适配器支持的最大值
  );

  // 请求设备时指定更高的存储缓冲区绑定大小限制
  缓存.设备 = await 缓存.适配器.requestDevice({
    requiredLimits: {
      maxStorageBufferBindingSize: 所需存储缓冲区限制
    }
  });
  if (!缓存.设备) {
    throw new Error('无法获取 WebGPU 设备');
  }

  return 缓存.设备;
};

// 导出英文接口兼容
export const getWebGPUDevice = 获取WebGPU设备;
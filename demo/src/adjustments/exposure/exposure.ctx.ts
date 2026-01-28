/**
 * 曝光调整模块的上下文文件
 * 管理模块内部的依赖和共享状态
 */
import { ResourcePool } from './ResourcePool.class'

// 全局资源池实例（模块级别的单例）
let resourcePool: ResourcePool | null = null

/**
 * 初始化GPU设备和资源池
 * @returns GPU设备实例
 */
export async function initializeGPU(): Promise<GPUDevice> {
    if (!navigator.gpu) {
        throw new Error('WebGPU not supported')
    }

    const adapter = await navigator.gpu.requestAdapter()
    if (!adapter) {
        throw new Error('Failed to get GPU adapter')
    }

    // 获取适配器限制信息
    const 适配器限制 = adapter.limits

    // 计算所需的存储缓冲区大小限制
    const 所需存储缓冲区限制 = Math.min(
        适配器限制.maxStorageBufferBindingSize || 134217728, // 默认128MB
        2147483644 // 适配器支持的最大值
    )

    // 计算所需的缓冲区大小限制
    // 解决 Buffer size exceeds the max buffer size limit 错误
    const 所需缓冲区大小限制 = Math.min(
        适配器限制.maxBufferSize || 268435456, // 默认256MB
        2147483648 // 最大可设置为2GB
    )

    // 请求设备时指定存储缓冲区绑定大小限制和缓冲区大小限制
    const device = await adapter.requestDevice({
        requiredLimits: {
            maxStorageBufferBindingSize: 所需存储缓冲区限制,
            maxBufferSize: 所需缓冲区大小限制
        }
    })
    resourcePool = new ResourcePool(device)
    return device
}

/**
 * 获取资源池实例
 * 如果未初始化则自动初始化
 */
export async function getResourcePool(): Promise<ResourcePool> {
    if (!resourcePool) {
        await initializeGPU()
    }
    return resourcePool!
}

/**
 * 获取GPU设备
 * 如果未初始化则自动初始化
 */
export async function getDevice(): Promise<GPUDevice> {
    const pool = await getResourcePool()
    return pool.device
}

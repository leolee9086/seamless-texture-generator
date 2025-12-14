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

    const device = await adapter.requestDevice()
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

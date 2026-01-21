/**
 * 格式转换器
 * 提供 GPU↔CPU 数据格式的统一转换接口
 */
import type { PipelineData } from '../imports'
import { gpuBufferToImageData } from './imports'
import { imageDataToGPUBuffer } from '../imageProcessor.utils'
import type { 管线数据格式 } from './types'

/**
 * 将 PipelineData 转换为 ImageData
 */
export async function 转换为ImageData(
    data: PipelineData,
    device: GPUDevice
): Promise<ImageData> {
    return await gpuBufferToImageData(data.buffer, data.width, data.height, device)
}

/**
 * 将 ImageData 转换为 PipelineData
 */
export async function 转换为PipelineData(
    imageData: ImageData,
    device: GPUDevice
): Promise<PipelineData> {
    const buffer = await imageDataToGPUBuffer(imageData, device)
    return {
        buffer,
        width: imageData.width,
        height: imageData.height
    }
}

/**
 * 获取当前数据格式
 */
export function 获取数据格式(data: PipelineData | ImageData): 管线数据格式 {
    if ('buffer' in data && data.buffer instanceof GPUBuffer) {
        return 'GPUBuffer'
    }
    return 'ImageData'
}

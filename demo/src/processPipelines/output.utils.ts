import type { PipelineData } from './imports'
import { gpuBufferToImageData, getWebGPUDevice } from './imports'

/**
 * 将 GPUBuffer 转换为 DataURL
 * @param data 管线数据
 * @returns DataURL 字符串
 */
export async function convertToDataURL(data: PipelineData): Promise<string> {
    const device = await getWebGPUDevice()

    // 将 GPUBuffer 转换为 ImageData
    const imageData = await gpuBufferToImageData(data.buffer, data.width, data.height, device)

    // 将处理后的图像数据转换为URL
    const canvas = document.createElement('canvas')
    canvas.width = imageData.width
    canvas.height = imageData.height
    const ctx = canvas.getContext('2d')!
    ctx.putImageData(imageData, 0, 0)

    return canvas.toDataURL()
}

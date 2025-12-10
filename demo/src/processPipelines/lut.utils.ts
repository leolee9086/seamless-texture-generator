import type { PipelineData } from './imports'
import type { PipelineOptions } from './imageProcessor.types'
import { gpuBufferToImageData, processLutData, processImageWithLUT } from './imports'
import { imageDataToGPUBuffer } from './imageProcessor.utils'
import { getWebGPUDevice } from './imports'

/**
 * 执行 LUT 处理步骤
 * @param data 管线数据
 * @param options 管线选项
 * @returns 处理后的管线数据
 */
export async function executeLUTProcess(
    data: PipelineData,
    options: PipelineOptions
): Promise<PipelineData> {
    // 如果没有 LUT 文件，直接返回原数据
    if (!options.lutFile) {
        return data
    }

    const device = await getWebGPUDevice()

    try {
        // 将 GPUBuffer 转换为 ImageData（内部处理需要）
        const imageData = await gpuBufferToImageData(data.buffer, data.width, data.height, device)

        // 解析 LUT 文件
        const lutResult = await processLutData(options.lutFile, options.lutFile.name)

        // 准备 maskData 对象
        interface MaskOptions {
            intensity: number
            maskData?: {
                data: Uint8Array
                width: number
                height: number
            }
            maskIntensity?: number
            enableMask?: boolean
        }

        const maskOptions: MaskOptions = {
            intensity: options.lutIntensity || 1.0
        }

        if (!options.maskData) {
            console.warn('⚠️ 无蒙版数据')
        }

        if (options.maskData) {
            console.warn('🎭 应用蒙版:', imageData)
            maskOptions.maskData = {
                data: options.maskData,
                width: imageData.width,
                height: imageData.height
            }
            maskOptions.maskIntensity = 1.0
            maskOptions.enableMask = true
        }

        // 使用LUT库处理图像
        const processResult = await processImageWithLUT(
            { data: new Uint8Array(imageData.data.buffer), width: imageData.width, height: imageData.height },
            lutResult.data,
            maskOptions
        )

        if (processResult.success && processResult.result) {
            // 更新图像数据为LUT处理后的结果
            const processedImageData = new ImageData(
                new Uint8ClampedArray(processResult.result),
                imageData.width,
                imageData.height
            )

            // 转换回 GPUBuffer
            const processedBuffer = await imageDataToGPUBuffer(processedImageData, device)

            // 销毁旧的 buffer
            data.buffer.destroy()

            return {
                buffer: processedBuffer,
                width: data.width,
                height: data.height
            }
        }
    } catch (error) {
        console.warn('LUT处理失败，继续使用原始图像:', error)
    }

    // LUT 处理失败或未成功时返回原数据
    return data
}

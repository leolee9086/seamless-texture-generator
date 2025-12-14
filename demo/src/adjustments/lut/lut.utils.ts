import type { PipelineData, PipelineOptions, LutMaskOptions, ApplyLUTParams } from './imports'
import { gpuBufferToImageData, processLutData, processImageWithLUT, imageDataToGPUBuffer, getWebGPUDevice } from './imports'
import { WARNING_NO_MASK_DATA, LOG_APPLYING_MASK } from './lut.constants'

/**
 * 准备 LUT 掩码选项
 */
function prepareMaskOptions(
    options: PipelineOptions,
    imageData: ImageData
): LutMaskOptions {
    const maskOptions: LutMaskOptions = {
        intensity: options.lutIntensity || 1.0
    }

    if (!options.maskData) {
        console.warn(WARNING_NO_MASK_DATA)
        return maskOptions
    }

    console.warn(LOG_APPLYING_MASK, imageData)
    maskOptions.maskData = {
        data: options.maskData,
        width: imageData.width,
        height: imageData.height
    }
    maskOptions.maskIntensity = 1.0
    maskOptions.enableMask = true

    return maskOptions
}

/**
 * 应用 LUT 到图像数据并返回处理后的 GPUBuffer
 */
async function applyLUTToImageData(
    params: ApplyLUTParams
): Promise<{ buffer: GPUBuffer; width: number; height: number } | null> {
    const { imageData, lutData, maskOptions, device } = params
    const processResult = await processImageWithLUT(
        {
            data: new Uint8Array(imageData.data.buffer),
            width: imageData.width,
            height: imageData.height
        },
        lutData,
        maskOptions
    )

    if (!processResult.success || !processResult.result) {
        return null
    }

    const processedImageData = new ImageData(
        new Uint8ClampedArray(processResult.result),
        imageData.width,
        imageData.height
    )

    const processedBuffer = await imageDataToGPUBuffer(processedImageData, device)
    return { buffer: processedBuffer, width: imageData.width, height: imageData.height }
}

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
        const maskOptions = prepareMaskOptions(options, imageData)

        // 使用LUT库处理图像
        const processed = await applyLUTToImageData({
            imageData,
            lutData: lutResult.data,
            maskOptions,
            device
        })

        if (processed) {
            // 销毁旧的 buffer
            data.buffer.destroy()
            return {
                buffer: processed.buffer,
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

/**
 * 曝光调整模块 - 主入口
 */
import type { HSLAdjustmentLayer } from './imports'
import type { ExposureContext } from './exposureAdjustment.types'
import { getDevice } from './exposure.ctx'
import { calculateHistogram, calculateExposureParams, calculateCDF } from './exposureAdjustment.histogram'
import {
    createAutoExposurePipeline,
    createInputTexture,
    createOutputTexture,
    createAndSetupBuffers,
    executeGPUComputation
} from './exposureAdjustment.gpu'

// 重新导出类型供外部使用
export type { ExposureAdjustmentParams, ExposureHistogramData, ExposureContext } from './exposureAdjustment.types'

/** 自动曝光调整 */
export async function adjustExposure(
    imageData: ImageData,
    strength: number = 1.0
): Promise<ImageData> {
    // 通过 ctx 获取 GPU 设备（自动初始化）
    const device = await getDevice()
    const { width, height } = imageData

    try {
        // 计算直方图
        const histogram = calculateHistogram(imageData)

        // 计算曝光调整参数
        const params = calculateExposureParams(histogram)
        params.strength = strength

        // 计算CDF
        const cdf = calculateCDF(histogram)

        // 创建曝光上下文
        const ctx: ExposureContext = { device, imageData, width, height }

        // 创建GPU资源
        const { pipeline, uniformBuffer, bindGroupLayout } = await createAutoExposurePipeline(device)
        ctx.pipeline = pipeline
        ctx.uniformBuffer = uniformBuffer
        ctx.bindGroupLayout = bindGroupLayout

        ctx.inputTexture = await createInputTexture(ctx)
        ctx.outputTexture = createOutputTexture(ctx)

        const { histogramBuffer, cdfBuffer } = await createAndSetupBuffers(device, histogram, cdf)
        ctx.histogramBuffer = histogramBuffer
        ctx.cdfBuffer = cdfBuffer

        // 更新 uniform buffer
        device.queue.writeBuffer(
            uniformBuffer,
            0,
            new Float32Array([
                width,
                height,
                params.strength,
                params.targetExposure,
                params.localAdjustFactor
            ])
        )

        // 执行GPU计算
        const result = await executeGPUComputation(ctx)

        // 清理资源
        ctx.uniformBuffer?.destroy()
        ctx.inputTexture?.destroy()
        ctx.outputTexture?.destroy()
        ctx.histogramBuffer?.destroy()
        ctx.cdfBuffer?.destroy()

        return result

    } catch (error) {
        console.error('曝光调整失败:', error)
        throw error
    }
}

/** 手动曝光调整函数 */
export function adjustExposureManual(
    imageData: ImageData,
    exposure: number,
    contrast: number = 1.0,
    gamma: number = 1.0
): ImageData {
    const data = new Uint8ClampedArray(imageData.data)
    const result = new ImageData(data, imageData.width, imageData.height)

    for (let i = 0; i < data.length; i += 4) {
        // 转换为0-1范围
        let r = data[i] / 255
        let g = data[i + 1] / 255
        let b = data[i + 2] / 255

        // 应用曝光
        r = r * exposure
        g = g * exposure
        b = b * exposure

        // 应用对比度
        r = ((r - 0.5) * contrast) + 0.5
        g = ((g - 0.5) * contrast) + 0.5
        b = ((b - 0.5) * contrast) + 0.5

        // 应用伽马校正
        r = Math.pow(r, 1 / gamma)
        g = Math.pow(g, 1 / gamma)
        b = Math.pow(b, 1 / gamma)

        // 转换回0-255范围并限制在有效范围内
        data[i] = Math.max(0, Math.min(255, r * 255))
        data[i + 1] = Math.max(0, Math.min(255, g * 255))
        data[i + 2] = Math.max(0, Math.min(255, b * 255))
        // Alpha通道保持不变
    }

    return result
}

/** 将曝光调整转换为HSL调整层 */
export function exposureToHSLAdjustment(
    exposure: number,
    contrast: number = 1.0,
    _gamma: number = 1.0
): HSLAdjustmentLayer {
    // 将曝光调整转换为HSL参数
    // 这是一个简化的转换，实际应用中可能需要更复杂的算法
    const hue = 0 // 曝光调整不改变色相
    let saturation = 0

    // 根据对比度调整饱和度
    if (contrast > 1.0) {
        saturation = Math.min(20, (contrast - 1.0) * 20)
    } else if (contrast < 1.0) {
        saturation = Math.max(-20, (contrast - 1.0) * 20)
    }

    // 根据曝光调整明度
    const lightness = (exposure - 1.0) * 50

    return {
        id: 'exposure-adjustment',
        type: 'global',
        hue,
        saturation,
        lightness
    }
}
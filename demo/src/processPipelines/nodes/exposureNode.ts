import type { baseOptions } from './imports'
import type { NodeContext, Node } from './types'
import { adjustExposure, adjustExposureManual, gpuBufferToImageData } from './imports'

/**
 * 曝光调整 - 纯 CPU 处理函数
 */
async function 曝光处理(imageData: ImageData, options: baseOptions): Promise<ImageData> {
    // 自动曝光调整
    if (options.exposureStrength && options.exposureStrength !== 1.0) {
        return await adjustExposure(imageData, options.exposureStrength)
    }

    // 手动曝光调整
    if (options.exposureManual) {
        return adjustExposureManual(
            imageData,
            options.exposureManual.exposure,
            options.exposureManual.contrast,
            options.exposureManual.gamma
        )
    }

    return imageData
}

/**
 * 曝光调整中间件
 */
export const exposureMiddleware: Node = {
    名称: '曝光调整',
    可接受输入: ['ImageData'],
    输出格式: 'ImageData',

    guard: (options: baseOptions) => {
        const hasExposureStrength = (options.exposureStrength && options.exposureStrength !== 1.0)
        const hasExposureManual = (options.exposureManual &&
            (options.exposureManual.exposure !== 1.0 ||
                options.exposureManual.contrast !== 1.0 ||
                options.exposureManual.gamma !== 1.0))

        return hasExposureStrength || hasExposureManual
    },

    // 纯 CPU 处理，供批处理使用
    cpuProcess: 曝光处理,

    // 完整处理流程（包含格式转换）
    process: async (context: NodeContext) => {
        const { options, pipelineData } = context
        const device = await context.getWebGPUDevice()

        // GPU → CPU
        const imageData = await gpuBufferToImageData(pipelineData.buffer, pipelineData.width, pipelineData.height, device)

        try {
            const processedImageData = await 曝光处理(imageData, options)

            // CPU → GPU
            const processedBuffer = device.createBuffer({
                size: processedImageData.data.byteLength,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
                mappedAtCreation: true
            })
            new Uint8Array(processedBuffer.getMappedRange()).set(processedImageData.data)
            processedBuffer.unmap()

            // 销毁旧 buffer
            if (pipelineData.buffer instanceof GPUBuffer) {
                pipelineData.buffer.destroy()
            }

            context.pipelineData = {
                buffer: processedBuffer,
                width: processedImageData.width,
                height: processedImageData.height
            }
        } catch (error) {
            console.warn('曝光处理失败，继续使用原始图像:', error)
        }
    }
}
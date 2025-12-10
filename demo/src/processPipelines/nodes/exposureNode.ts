import type { baseOptions } from './imports'
import type { NodeContext, Node } from './types'
import { adjustExposure, adjustExposureManual, gpuBufferToImageData } from './imports'

/**
 * 曝光调整中间件
 */
export const exposureMiddleware: Node = {
    guard: (options: baseOptions) => {
        // 检查是否有曝光调整参数
        const hasExposureStrength = (options.exposureStrength && options.exposureStrength !== 1.0)
        const hasExposureManual = (options.exposureManual &&
            (options.exposureManual.exposure !== 1.0 ||
                options.exposureManual.contrast !== 1.0 ||
                options.exposureManual.gamma !== 1.0))

        return hasExposureStrength || hasExposureManual
    },

    process: async (context: NodeContext) => {
        const { options, pipelineData } = context

        // 获取 GPU 设备
        const device = await context.getWebGPUDevice()
        // 将 GPUBuffer/GPUTexture 转换为 ImageData
        const imageData = await gpuBufferToImageData(pipelineData.buffer, pipelineData.width, pipelineData.height, device)

        try {
            let processedImageData: ImageData

            // 自动曝光调整
            if (options.exposureStrength && options.exposureStrength !== 1.0) {
                processedImageData = await adjustExposure(imageData, options.exposureStrength)
                return updateContext(processedImageData)
            }

            // 手动曝光调整
            if (options.exposureManual) {
                processedImageData = adjustExposureManual(
                    imageData,
                    options.exposureManual.exposure,
                    options.exposureManual.contrast,
                    options.exposureManual.gamma
                )
                return updateContext(processedImageData)
            }

            // 无需调整，使用原始图像
            processedImageData = imageData
            return updateContext(processedImageData)
        } catch (error) {
            console.warn('曝光处理失败，继续使用原始图像:', error)
        }

        // 辅助函数：更新上下文
        function updateContext(processedImageData: ImageData): void {
            // 转换回 GPUBuffer
            const processedBuffer = device.createBuffer({
                size: processedImageData.data.byteLength,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
                mappedAtCreation: true
            })
            new Uint8Array(processedBuffer.getMappedRange()).set(processedImageData.data)
            processedBuffer.unmap()

            // 销毁旧的 buffer
            if (pipelineData.buffer instanceof GPUBuffer) {
                pipelineData.buffer.destroy()
            }
            if (pipelineData.buffer instanceof GPUTexture) {
                pipelineData.buffer.destroy()
            }

            // 更新上下文中的 pipelineData
            context.pipelineData = {
                buffer: processedBuffer,
                width: processedImageData.width,
                height: processedImageData.height
            }
        }
    }
}
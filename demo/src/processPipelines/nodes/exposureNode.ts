import { PipelineData, baseOptions } from '../../types/PipelineData.type'
import { NodeContext, Node } from './types'
import { adjustExposure, adjustExposureManual } from '../../adjustments/exposureAdjustment'
import { gpuBufferToImageData } from '../../utils/webgpu/convert/gpuBufferToImageData'

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

            if (options.exposureStrength && options.exposureStrength !== 1.0) {
                // 自动曝光调整
                processedImageData = await adjustExposure(imageData, options.exposureStrength)
            } else if (options.exposureManual) {
                // 手动曝光调整
                processedImageData = adjustExposureManual(
                    imageData,
                    options.exposureManual.exposure,
                    options.exposureManual.contrast,
                    options.exposureManual.gamma
                )
            } else {
                processedImageData = imageData
            }

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
            } else if (pipelineData.buffer instanceof GPUTexture) {
                pipelineData.buffer.destroy()
            }

            // 更新上下文中的 pipelineData
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
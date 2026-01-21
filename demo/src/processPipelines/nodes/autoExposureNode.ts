import type { baseOptions } from './imports'
import type { NodeContext, Node } from './types'
import type { AutoExposureMode, CLAHEConfig } from '../../adjustments/exposure/exposureAdjustment.types'
import { adjustExposure, gpuBufferToImageData } from './imports'
import { 执行CLAHE } from '../../adjustments/exposure/clahe.gpu'

/**
 * 扩展的自动曝光选项
 */
interface AutoExposureOptions extends baseOptions {
    exposureStrength?: number
    exposureMode?: AutoExposureMode
    claheConfig?: Partial<CLAHEConfig>
}

/**
 * CDF模式自动曝光处理 - CPU实现
 */
async function CDF自动曝光处理(imageData: ImageData, strength: number): Promise<ImageData> {
    return await adjustExposure(imageData, strength)
}

/**
 * 将GPUBuffer转为GPUTexture（CLAHE需要纹理输入）
 */
async function gpuBufferToTexture(
    device: GPUDevice,
    buffer: GPUBuffer,
    width: number,
    height: number
): Promise<GPUTexture> {
    const texture = device.createTexture({
        size: { width, height },
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.STORAGE_BINDING
    })

    // 从buffer读取数据
    const stagingBuffer = device.createBuffer({
        size: width * height * 4,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    })

    const encoder = device.createCommandEncoder()
    encoder.copyBufferToBuffer(buffer, 0, stagingBuffer, 0, width * height * 4)
    device.queue.submit([encoder.finish()])
    await device.queue.onSubmittedWorkDone()

    await stagingBuffer.mapAsync(GPUMapMode.READ)
    const data = new Uint8Array(stagingBuffer.getMappedRange()).slice()
    stagingBuffer.unmap()
    stagingBuffer.destroy()

    device.queue.writeTexture(
        { texture },
        data,
        { bytesPerRow: width * 4, rowsPerImage: height },
        { width, height }
    )

    return texture
}



/**
 * 自动曝光分析节点
 * 支持多种分析模式：CDF、直方图均衡化、CLAHE、自适应伽马
 */
export const autoExposureMiddleware: Node<AutoExposureOptions> = {
    名称: '自动曝光分析',
    可接受输入: ['GPUBuffer'],
    输出格式: 'GPUBuffer',

    /** @简洁函数 自动曝光启用条件检查 */
    guard: (options: AutoExposureOptions) => {
        // CDF模式检查strength
        if (options.exposureMode === 'cdf' || !options.exposureMode) {
            return options.exposureStrength !== undefined && options.exposureStrength !== 1.0
        }
        // CLAHE模式总是启用（如果选择了CLAHE）
        if (options.exposureMode === 'clahe') {
            return true
        }
        // 其他模式暂未实现
        return false
    },

    cpuProcess: undefined, // GPU节点

    process: async (context: NodeContext<AutoExposureOptions>) => {
        const { options, pipelineData } = context
        const device = await context.getWebGPUDevice()
        const mode = options.exposureMode || 'cdf'

        try {
            if (mode === 'clahe') {
                // CLAHE模式 - 纯GPU处理
                // 需要Buffer判断
                if (!(pipelineData.buffer instanceof GPUBuffer)) {
                    console.warn('CLAHE需要GPUBuffer输入')
                    return
                }

                // 转换为纹理
                const inputTexture = await gpuBufferToTexture(
                    device,
                    pipelineData.buffer,
                    pipelineData.width,
                    pipelineData.height
                )

                // 执行CLAHE - 返回 Buffer (紧凑格式)
                const outputBuffer = await 执行CLAHE(device, inputTexture, {
                    ...options.claheConfig,
                    strength: options.claheConfig.strength ?? 1.0 // 传递强度参数
                })

                // 清理
                inputTexture.destroy()
                pipelineData.buffer.destroy()

                context.pipelineData = {
                    buffer: outputBuffer,
                    width: pipelineData.width,
                    height: pipelineData.height
                }
            } else {
                // CDF模式 - 需要CPU计算直方图
                const imageData = await gpuBufferToImageData(
                    pipelineData.buffer,
                    pipelineData.width,
                    pipelineData.height,
                    device
                )

                const processedImageData = await CDF自动曝光处理(
                    imageData,
                    options.exposureStrength || 1.0
                )

                const processedBuffer = device.createBuffer({
                    size: processedImageData.data.byteLength,
                    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
                    mappedAtCreation: true
                })
                new Uint8Array(processedBuffer.getMappedRange()).set(processedImageData.data)
                processedBuffer.unmap()

                if (pipelineData.buffer instanceof GPUBuffer) {
                    pipelineData.buffer.destroy()
                }

                context.pipelineData = {
                    buffer: processedBuffer,
                    width: processedImageData.width,
                    height: processedImageData.height
                }
            }
        } catch (error) {
            console.warn('自动曝光处理失败:', error)
        }
    }
}

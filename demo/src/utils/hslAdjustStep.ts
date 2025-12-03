/**
 * HSL调整处理步骤
 * 在图像处理管线中应用HSL颜色调整
 */

import { WebGPUHSLProcessor } from './webgpu/hsl-processor'
import { type HSLAdjustmentParams } from './webgpu/hsl-shaders'

/**
 * HSL调整层接口
 */
export interface HSLAdjustmentLayer {
    id: string
    type: 'global' | 'selective'
    targetColor?: string  // selective模式使用
    hue: number           // -180 到 180
    saturation: number    // -100 到 100
    lightness: number     // -100 到 100
    precision?: number    // 0-100, selective模式使用
    range?: number        // 0-100, selective模式使用
}

/**
 * 管线数据接口
 */
interface PipelineData {
    buffer: GPUBuffer
    width: number
    height: number
}

/**
 * HSL调整处理步骤类
 * 支持多层HSL调整叠加，包括全局调整和基于色块的选择性调整
 */
export class HSLAdjustProcessStep {
    /**
     * 执行HSL调整
     * @param data 管线数据
     * @param hslLayers HSL调整层数组
     * @param device WebGPU设备
     * @returns 处理后的管线数据
     */
    async execute(
        data: PipelineData,
        hslLayers: HSLAdjustmentLayer[] | undefined,
        device: GPUDevice
    ): Promise<PipelineData> {
        // 如果没有HSL调整层，直接返回原数据
        if (!hslLayers || hslLayers.length === 0) {
            return data
        }

        // 过滤出有实际调整的层（跳过所有值都为0的层）
        const activeLayers = hslLayers.filter(
            layer => layer.hue !== 0 || layer.saturation !== 0 || layer.lightness !== 0
        )

        if (activeLayers.length === 0) {
            return data
        }

        // 创建HSL处理器
        const processor = new WebGPUHSLProcessor(device, false)

        try {
            // 创建纹理描述符
            const textureDescriptor: GPUTextureDescriptor = {
                size: { width: data.width, height: data.height },
                format: 'rgba8unorm',
                usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC | GPUTextureUsage.STORAGE_BINDING,
                label: 'HSL Input Texture'
            }

            // 创建输入纹理并上传数据
            const inputTexture = device.createTexture(textureDescriptor)

            // 从GPUBuffer复制数据到纹理
            const commandEncoder1 = device.createCommandEncoder({ label: 'HSL Copy Input' })

            // 创建临时buffer用于复制
            const tempBuffer = device.createBuffer({
                size: data.width * data.height * 4,
                usage: GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
                mappedAtCreation: false
            })

            // 复制数据: buffer -> tempBuffer -> texture
            commandEncoder1.copyBufferToBuffer(data.buffer, 0, tempBuffer, 0, data.width * data.height * 4)

            // 计算对齐的bytesPerRow (必须是256的倍数)
            const alignment = 256
            const bytesPerRow = data.width * 4
            const alignedBytesPerRow = Math.ceil(bytesPerRow / alignment) * alignment

            commandEncoder1.copyBufferToTexture(
                { buffer: tempBuffer, offset: 0, bytesPerRow: alignedBytesPerRow },
                { texture: inputTexture },
                { width: data.width, height: data.height }
            )

            device.queue.submit([commandEncoder1.finish()])

            // 创建两个临时纹理用于叠加处理
            let tempTexture1 = device.createTexture({
                ...textureDescriptor,
                label: 'HSL Temp Texture 1'
            })
            let tempTexture2 = device.createTexture({
                ...textureDescriptor,
                label: 'HSL Temp Texture 2'
            })

            let currentInputTexture = inputTexture
            let useTemp1 = true

            // 依次应用每一层HSL调整（叠加效果）
            for (const layer of activeLayers) {
                const params: HSLAdjustmentParams = {
                    targetColor: layer.targetColor || '#000000',
                    hueOffset: layer.hue,
                    saturationOffset: layer.saturation,
                    lightnessOffset: layer.lightness,
                    precision: layer.precision ?? 100,  // 全局调整使用100（最大范围）
                    range: layer.range ?? 100,
                    maskMode: layer.type === 'global' ? 'adjust' : 'adjust'  // 都使用adjust模式
                }

                const commandEncoder = device.createCommandEncoder({ label: `HSL Process Layer ${layer.id}` })

                // 交替使用临时纹理
                const outputTexture = useTemp1 ? tempTexture1 : tempTexture2

                processor.processImage(
                    currentInputTexture,
                    outputTexture,
                    params,
                    commandEncoder
                )

                // 立即提交当前层的处理
                device.queue.submit([commandEncoder.finish()])

                // 交换纹理引用
                currentInputTexture = outputTexture
                useTemp1 = !useTemp1
            }

            // 将最终结果从纹理复制回GPUBuffer
            const outputBuffer = device.createBuffer({
                size: data.width * data.height * 4,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
                label: 'HSL Output Buffer'
            })

            const commandEncoder2 = device.createCommandEncoder({ label: 'HSL Copy Output' })

            commandEncoder2.copyTextureToBuffer(
                { texture: currentInputTexture },
                { buffer: outputBuffer, offset: 0, bytesPerRow: alignedBytesPerRow },
                { width: data.width, height: data.height }
            )

            device.queue.submit([commandEncoder2.finish()])

            // 清理临时资源
            inputTexture.destroy()
            tempTexture1.destroy()
            tempTexture2.destroy()
            tempBuffer.destroy()

            // 销毁旧的buffer
            data.buffer.destroy()

            return {
                buffer: outputBuffer,
                width: data.width,
                height: data.height
            }
        } finally {
            processor.destroy()
        }
    }
}

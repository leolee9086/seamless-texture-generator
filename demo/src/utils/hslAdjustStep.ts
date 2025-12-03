/**
 * HSL调整处理步骤
 * 在图像处理管线中应用HSL颜色调整
 */

import { WebGPUHSLProcessor, processGlobalHSLImage } from './webgpu/hsl-processor'
import { type HSLAdjustmentParams, type GlobalHSLAdjustmentParams } from './webgpu/hsl-shaders'

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

        // 分离全局调整层和选择性调整层
        const globalLayers = activeLayers.filter(layer => layer.type === 'global')
        const selectiveLayers = activeLayers.filter(layer => layer.type === 'selective')

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

        // 创建临时纹理用于处理
        let currentInputTexture = inputTexture
        let outputTexture: GPUTexture | null = null
        
        // 统一管理所有需要销毁的纹理
        const texturesToDestroy: GPUTexture[] = []

        // 首先处理全局调整（如果有）
        if (globalLayers.length > 0) {
            // 合并所有全局调整参数
            const globalParams: GlobalHSLAdjustmentParams = {
                hueOffset: globalLayers.reduce((sum, layer) => sum + layer.hue, 0),
                saturationOffset: globalLayers.reduce((sum, layer) => sum + layer.saturation, 0),
                lightnessOffset: globalLayers.reduce((sum, layer) => sum + layer.lightness, 0)
            }

            // 创建输出纹理
            outputTexture = device.createTexture({
                ...textureDescriptor,
                label: 'Global HSL Output Texture'
            })

            // 使用全局HSL着色器处理
            await processGlobalHSLImage(device, currentInputTexture, outputTexture, globalParams, false)

            // 等待GPU命令完成后再销毁纹理
            await device.queue.onSubmittedWorkDone()

            // 将需要销毁的纹理收集起来
            if (currentInputTexture !== inputTexture) {
                texturesToDestroy.push(currentInputTexture)
            }
            currentInputTexture = outputTexture
        }

        // 然后处理选择性调整（如果有）
        if (selectiveLayers.length > 0) {
            // 创建HSL处理器
            const processor = new WebGPUHSLProcessor(device, false)

            try {
                // 创建两个临时纹理用于叠加处理
                let tempTexture1 = device.createTexture({
                    ...textureDescriptor,
                    label: 'HSL Temp Texture 1'
                })
                let tempTexture2 = device.createTexture({
                    ...textureDescriptor,
                    label: 'HSL Temp Texture 2'
                })

                let useTemp1 = true

                // 依次应用每一层选择性HSL调整（叠加效果）
                for (const layer of selectiveLayers) {
                    const params: HSLAdjustmentParams = {
                        targetColor: layer.targetColor || '#000000',
                        hueOffset: layer.hue,
                        saturationOffset: layer.saturation,
                        lightnessOffset: layer.lightness,
                        precision: layer.precision ?? 30,
                        range: layer.range ?? 50,
                        maskMode: 'adjust'
                    }

                    const commandEncoder = device.createCommandEncoder({ label: `HSL Process Layer ${layer.id}` })

                    // 交替使用临时纹理
                    const selectiveOutputTexture = useTemp1 ? tempTexture1 : tempTexture2

                    processor.processImage(
                        currentInputTexture,
                        selectiveOutputTexture,
                        params,
                        commandEncoder
                    )

                    // 提交当前层的处理
                    const commandBuffer = commandEncoder.finish()
                    device.queue.submit([commandBuffer])

                    // 将需要销毁的纹理收集起来（除了当前正在使用的）
                    if (currentInputTexture !== inputTexture &&
                        currentInputTexture !== tempTexture1 &&
                        currentInputTexture !== tempTexture2) {
                        texturesToDestroy.push(currentInputTexture)
                    }

                    // 交换纹理引用
                    currentInputTexture = selectiveOutputTexture
                    useTemp1 = !useTemp1
                }

                // 等待所有GPU命令完成后再销毁纹理
                await device.queue.onSubmittedWorkDone()

                // 销毁临时纹理（除了当前正在使用的）
                if (currentInputTexture !== tempTexture1) {
                    tempTexture1.destroy()
                }
                if (currentInputTexture !== tempTexture2) {
                    tempTexture2.destroy()
                }
            } finally {
                processor.destroy()
            }
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

        // 等待GPU命令完成后再销毁纹理
        await device.queue.onSubmittedWorkDone()

        // 清理临时资源
        inputTexture.destroy()
        tempBuffer.destroy()
        
        // 销毁所有收集到的纹理
        texturesToDestroy.forEach(texture => {
            if (texture !== currentInputTexture) {
                texture.destroy()
            }
        })
        
        // 销毁最终的输入纹理（如果不是原始输入纹理且还未被销毁）
        if (currentInputTexture !== inputTexture &&
            !texturesToDestroy.includes(currentInputTexture)) {
            currentInputTexture.destroy()
        }

        // 销毁旧的buffer
        data.buffer.destroy()

        return {
            buffer: outputBuffer,
            width: data.width,
            height: data.height
        }
    }
}

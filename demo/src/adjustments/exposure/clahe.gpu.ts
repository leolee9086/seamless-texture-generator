/**
 * @fileoverview CLAHE GPU 执行器
 * 限制对比度自适应直方图均衡化的 WebGPU 实现
 * 
 * 参考实现: toread/claheWebgpu
 */

import { 生成CLAHE着色器 } from './clahe.code'

/** CLAHE 参数接口 */
export interface CLAHEParams {
    /** 对比度限制 [1.0, 4.0] */
    clipLimit: number
    /** 分块大小 [32, 64, 128] */
    blockSize: number
    /** 直方图bin数 [128, 256] */
    numBins: number
}

/** 默认CLAHE参数 */
export const 默认CLAHE参数: CLAHEParams = {
    clipLimit: 2.0,
    blockSize: 64,
    numBins: 256
}

/** 管线缓存 */
interface CLAHEPipelines {
    histogramPipeline: GPUComputePipeline
    histogramLayout: GPUBindGroupLayout
    clipPipeline: GPUComputePipeline
    clipLayout: GPUBindGroupLayout
    cdfPipeline: GPUComputePipeline
    cdfLayout: GPUBindGroupLayout
    applyLUTPipeline: GPUComputePipeline
    applyLUTLayout: GPUBindGroupLayout
}

let 缓存管线: CLAHEPipelines | null = null
let 缓存参数Key: string | null = null

/**
 * 创建CLAHE参数uniform缓冲区
 */
function 创建Uniform缓冲区(
    device: GPUDevice,
    params: CLAHEParams,
    width: number,
    height: number
): GPUBuffer {
    const bufferData = new ArrayBuffer(20) // 5个u32/f32
    const view = new DataView(bufferData)
    view.setUint32(0, width, true)
    view.setUint32(4, height, true)
    view.setFloat32(8, params.clipLimit, true)
    view.setUint32(12, params.blockSize, true)
    view.setUint32(16, params.numBins, true)

    const uniformBuffer = device.createBuffer({
        size: 20,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        label: 'CLAHE Uniform Buffer'
    })
    device.queue.writeBuffer(uniformBuffer, 0, bufferData)
    return uniformBuffer
}

/**
 * 获取或创建CLAHE管线
 */
async function 获取管线(device: GPUDevice, params: CLAHEParams): Promise<CLAHEPipelines> {
    const paramsKey = `${params.clipLimit}-${params.blockSize}-${params.numBins}`

    if (缓存管线 && 缓存参数Key === paramsKey) {
        return 缓存管线
    }

    const shaders = 生成CLAHE着色器(params)

    // 创建管线辅助函数
    function createPipeline(
        shaderCode: string,
        bindings: GPUBindGroupLayoutEntry[],
        label: string
    ) {
        const shaderModule = device.createShaderModule({ code: shaderCode, label: `${label} Shader` })
        const bindGroupLayout = device.createBindGroupLayout({ entries: bindings, label: `${label} Layout` })
        const pipeline = device.createComputePipeline({
            layout: device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
            compute: { module: shaderModule, entryPoint: 'main' },
            label
        })
        return { pipeline, bindGroupLayout }
    }

    // 直方图计算管线
    const histogramBindings: GPUBindGroupLayoutEntry[] = [
        { binding: 0, visibility: GPUShaderStage.COMPUTE, texture: { sampleType: 'unfilterable-float' } },
        { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
        { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } }
    ]
    const { pipeline: histogramPipeline, bindGroupLayout: histogramLayout } =
        createPipeline(shaders.直方图着色器, histogramBindings, 'CLAHE Histogram')

    // 对比度裁剪管线
    const clipBindings: GPUBindGroupLayoutEntry[] = [
        { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
        { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
        { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } }
    ]
    const { pipeline: clipPipeline, bindGroupLayout: clipLayout } =
        createPipeline(shaders.裁剪着色器, clipBindings, 'CLAHE Clip')

    // CDF计算管线
    const cdfBindings: GPUBindGroupLayoutEntry[] = [
        { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
        { binding: 1, visibility: GPUShaderStage.COMPUTE, storageTexture: { access: 'write-only', format: 'rgba8unorm' } },
        { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } }
    ]
    const { pipeline: cdfPipeline, bindGroupLayout: cdfLayout } =
        createPipeline(shaders.CDF着色器, cdfBindings, 'CLAHE CDF')

    // LUT应用管线
    const applyLUTBindings: GPUBindGroupLayoutEntry[] = [
        { binding: 0, visibility: GPUShaderStage.COMPUTE, texture: { sampleType: 'unfilterable-float' } },
        { binding: 1, visibility: GPUShaderStage.COMPUTE, texture: { sampleType: 'unfilterable-float' } },
        { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
        { binding: 3, visibility: GPUShaderStage.COMPUTE, storageTexture: { access: 'write-only', format: 'rgba8unorm' } }
    ]
    const { pipeline: applyLUTPipeline, bindGroupLayout: applyLUTLayout } =
        createPipeline(shaders.应用LUT着色器, applyLUTBindings, 'CLAHE Apply LUT')

    缓存管线 = {
        histogramPipeline, histogramLayout,
        clipPipeline, clipLayout,
        cdfPipeline, cdfLayout,
        applyLUTPipeline, applyLUTLayout
    }
    缓存参数Key = paramsKey

    return 缓存管线
}

/**
 * 执行CLAHE算法
 * @param device WebGPU设备
 * @param inputTexture 输入纹理
 * @param params CLAHE参数
 * @returns 输出纹理
 */
export async function 执行CLAHE(
    device: GPUDevice,
    inputTexture: GPUTexture,
    params: Partial<CLAHEParams> = {}
): Promise<GPUTexture> {
    const 最终参数: CLAHEParams = { ...默认CLAHE参数, ...params }
    const { clipLimit, blockSize, numBins } = 最终参数

    // 参数校验
    if (clipLimit < 1.0 || clipLimit > 4.0) {
        console.warn('CLAHE: clipLimit超出范围，使用默认值2.0')
        最终参数.clipLimit = 2.0
    }
    if (![32, 64, 128].includes(blockSize)) {
        console.warn('CLAHE: blockSize不合法，使用默认值64')
        最终参数.blockSize = 64
    }
    if (![128, 256].includes(numBins)) {
        console.warn('CLAHE: numBins不合法，使用默认值256')
        最终参数.numBins = 256
    }

    const width = inputTexture.width
    const height = inputTexture.height
    const numBlocksX = Math.ceil(width / 最终参数.blockSize)
    const numBlocksY = Math.ceil(height / 最终参数.blockSize)
    const numBlocks = numBlocksX * numBlocksY

    // 获取管线
    const pipelines = await 获取管线(device, 最终参数)

    // 创建缓冲区和纹理
    const histogramBufferSize = numBlocks * 最终参数.numBins * 4 * 4 // 4通道，每bin 4字节
    const histogramBuffer = device.createBuffer({
        size: histogramBufferSize,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
        label: 'CLAHE Histogram Buffer'
    })

    const excessBuffer = device.createBuffer({
        size: numBlocks * 4 * 4, // 每块4通道
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
        label: 'CLAHE Excess Buffer'
    })

    const lutTexture = device.createTexture({
        size: { width: 最终参数.numBins, height: numBlocks * 4 },
        format: 'rgba8unorm',
        usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
        label: 'CLAHE LUT Texture'
    })

    const outputTexture = device.createTexture({
        size: { width, height },
        format: 'rgba8unorm',
        usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC,
        label: 'CLAHE Output Texture'
    })

    const uniformBuffer = 创建Uniform缓冲区(device, 最终参数, width, height)

    // 创建BindGroups
    const histogramBindGroup = device.createBindGroup({
        layout: pipelines.histogramLayout,
        entries: [
            { binding: 0, resource: inputTexture.createView() },
            { binding: 1, resource: { buffer: histogramBuffer } },
            { binding: 2, resource: { buffer: uniformBuffer } }
        ]
    })

    const clipBindGroup = device.createBindGroup({
        layout: pipelines.clipLayout,
        entries: [
            { binding: 0, resource: { buffer: histogramBuffer } },
            { binding: 1, resource: { buffer: excessBuffer } },
            { binding: 2, resource: { buffer: uniformBuffer } }
        ]
    })

    const cdfBindGroup = device.createBindGroup({
        layout: pipelines.cdfLayout,
        entries: [
            { binding: 0, resource: { buffer: histogramBuffer } },
            { binding: 1, resource: lutTexture.createView() },
            { binding: 2, resource: { buffer: uniformBuffer } }
        ]
    })

    const applyLUTBindGroup = device.createBindGroup({
        layout: pipelines.applyLUTLayout,
        entries: [
            { binding: 0, resource: inputTexture.createView() },
            { binding: 1, resource: lutTexture.createView() },
            { binding: 2, resource: { buffer: uniformBuffer } },
            { binding: 3, resource: outputTexture.createView() }
        ]
    })

    // 执行四阶段
    const encoder = device.createCommandEncoder({ label: 'CLAHE Encoder' })

    // 阶段1：直方图计算
    {
        const pass = encoder.beginComputePass({ label: 'CLAHE Histogram Pass' })
        pass.setPipeline(pipelines.histogramPipeline)
        pass.setBindGroup(0, histogramBindGroup)
        pass.dispatchWorkgroups(numBlocksX, numBlocksY)
        pass.end()
    }

    // 阶段2：对比度裁剪
    {
        const pass = encoder.beginComputePass({ label: 'CLAHE Clip Pass' })
        pass.setPipeline(pipelines.clipPipeline)
        pass.setBindGroup(0, clipBindGroup)
        pass.dispatchWorkgroups(Math.ceil(numBlocks * 最终参数.numBins * 4 / 最终参数.numBins), 1)
        pass.end()
    }

    // 阶段3：CDF计算
    {
        const pass = encoder.beginComputePass({ label: 'CLAHE CDF Pass' })
        pass.setPipeline(pipelines.cdfPipeline)
        pass.setBindGroup(0, cdfBindGroup)
        pass.dispatchWorkgroups(Math.ceil(numBlocks * 最终参数.numBins * 4 / 最终参数.numBins), 1)
        pass.end()
    }

    // 阶段4：LUT应用
    {
        const pass = encoder.beginComputePass({ label: 'CLAHE Apply LUT Pass' })
        pass.setPipeline(pipelines.applyLUTPipeline)
        pass.setBindGroup(0, applyLUTBindGroup)
        pass.dispatchWorkgroups(Math.ceil(width / 16), Math.ceil(height / 16))
        pass.end()
    }

    device.queue.submit([encoder.finish()])
    await device.queue.onSubmittedWorkDone()

    // 清理临时资源
    histogramBuffer.destroy()
    excessBuffer.destroy()
    lutTexture.destroy()
    uniformBuffer.destroy()

    return outputTexture
}

/** 英文别名 */
export const applyCLAHE = 执行CLAHE
export const DEFAULT_CLAHE_PARAMS = 默认CLAHE参数

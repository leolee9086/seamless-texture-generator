/**
 * GPU 相关操作函数
 */
import type { ExposureContext } from './exposureAdjustment.types'
import { autoExposureShader } from './exposureAdjustment.code'

/** 创建自动曝光绑定组布局 */
function createAutoExposureBindGroupLayout(device: GPUDevice): GPUBindGroupLayout {
    return device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: 'uniform' }
            },
            {
                binding: 1,
                visibility: GPUShaderStage.COMPUTE,
                texture: { sampleType: 'float' }
            },
            {
                binding: 2,
                visibility: GPUShaderStage.COMPUTE,
                storageTexture: {
                    access: 'write-only',
                    format: 'rgba8unorm'
                }
            },
            {
                binding: 3,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: 'read-only-storage' }
            },
            {
                binding: 4,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: 'read-only-storage' }
            }
        ]
    })
}

/** 创建自动曝光 GPU 管线 */
export async function createAutoExposurePipeline(device: GPUDevice): Promise<{
    pipeline: GPUComputePipeline
    uniformBuffer: GPUBuffer
    bindGroupLayout: GPUBindGroupLayout
}> {
    if (!device) {
        throw new Error('GPU设备未初始化')
    }

    try {
        const bindGroupLayout = createAutoExposureBindGroupLayout(device)

        const pipelineLayout = device.createPipelineLayout({
            bindGroupLayouts: [bindGroupLayout]
        })

        const pipeline = await device.createComputePipelineAsync({
            layout: pipelineLayout,
            compute: {
                module: device.createShaderModule({
                    code: autoExposureShader
                }),
                entryPoint: 'main'
            }
        })

        const uniformBuffer = device.createBuffer({
            size: 20, // 5个32位值 (4字节 * 5)
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            mappedAtCreation: false
        })

        return { pipeline, uniformBuffer, bindGroupLayout }
    } catch (error) {
        console.error('创建GPU管线失败:', error)
        throw error
    }
}

/** 创建输入纹理 */
export async function createInputTexture(ctx: ExposureContext): Promise<GPUTexture> {
    const { device, imageData, width, height } = ctx
    if (!device || !imageData || !width || !height) {
        throw new Error('无效的输入参数')
    }

    try {
        const bytesPerPixel = 4 // RGBA格式
        const minBytesPerRow = width * bytesPerPixel

        // 创建纹理
        const texture = device.createTexture({
            size: [width, height],
            format: 'rgba8unorm',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
            dimension: '2d',
        })

        // 写入纹理
        device.queue.writeTexture(
            { texture },
            imageData.data,
            {
                bytesPerRow: minBytesPerRow,
                rowsPerImage: height
            },
            {
                width,
                height
            }
        )

        return texture
    } catch (error) {
        console.error('创建输入纹理失败:', error)
        throw error
    }
}

/** 创建输出纹理 */
export function createOutputTexture(ctx: ExposureContext): GPUTexture {
    const { device, width, height } = ctx
    if (!device || width < 1 || height < 1) {
        throw new Error('无效的参数')
    }

    return device.createTexture({
        size: [width, height],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.STORAGE_BINDING |
            GPUTextureUsage.COPY_SRC |
            GPUTextureUsage.COPY_DST |
            GPUTextureUsage.TEXTURE_BINDING,
        dimension: '2d',
        label: 'output_texture'
    })
}

/** 创建并设置缓冲区 */
export async function createAndSetupBuffers(
    device: GPUDevice,
    histogram: Uint32Array,
    cdf: Float32Array
): Promise<{ histogramBuffer: GPUBuffer; cdfBuffer: GPUBuffer }> {
    // 创建直方图缓冲区
    const histogramBuffer = device.createBuffer({
        size: 256 * 4, // 256个uint32值
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true
    })

    // 写入直方图数据
    new Uint32Array(histogramBuffer.getMappedRange()).set(histogram)
    histogramBuffer.unmap()

    // 创建CDF缓冲区
    const cdfBuffer = device.createBuffer({
        size: 256 * 4, // 256个float32值
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true
    })

    // 写入CDF数据
    new Float32Array(cdfBuffer.getMappedRange()).set(cdf)
    cdfBuffer.unmap()

    return { histogramBuffer, cdfBuffer }
}

/** GPU 计算相关常量 */
const WORKGROUP_SIZE = 16
const BYTES_PER_PIXEL = 4
const ALIGNMENT = 256

/** 计算对齐后的每行字节数 */
function getAlignedBytesPerRow(width: number): number {
    return Math.ceil(width * BYTES_PER_PIXEL / ALIGNMENT) * ALIGNMENT
}

/** 创建计算用的临时缓冲区 */
function createComputeBuffers(device: GPUDevice, bufferSize: number): {
    stagingBuffer: GPUBuffer
    outputBuffer: GPUBuffer
} {
    const stagingBuffer = device.createBuffer({
        size: bufferSize,
        usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
        label: 'staging_buffer'
    })

    const outputBuffer = device.createBuffer({
        size: bufferSize,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
        label: 'output_buffer'
    })

    return { stagingBuffer, outputBuffer }
}

/** 执行计算着色器 */
async function executeComputePass(ctx: ExposureContext): Promise<void> {
    const {
        device, pipeline, bindGroupLayout, uniformBuffer,
        inputTexture, outputTexture, histogramBuffer, cdfBuffer,
        width, height
    } = ctx

    const bindGroup = device!.createBindGroup({
        layout: bindGroupLayout!,
        entries: [
            { binding: 0, resource: { buffer: uniformBuffer! } },
            { binding: 1, resource: inputTexture!.createView() },
            { binding: 2, resource: outputTexture!.createView() },
            { binding: 3, resource: { buffer: histogramBuffer! } },
            { binding: 4, resource: { buffer: cdfBuffer! } }
        ],
        label: 'auto_exposure_bind_group'
    })

    const encoder = device!.createCommandEncoder({ label: 'compute_encoder' })
    const pass = encoder.beginComputePass({ label: 'compute_pass' })
    pass.setPipeline(pipeline!)
    pass.setBindGroup(0, bindGroup)
    pass.dispatchWorkgroups(
        Math.ceil(width / WORKGROUP_SIZE),
        Math.ceil(height / WORKGROUP_SIZE)
    )
    pass.end()

    device!.queue.submit([encoder.finish()])
    await device!.queue.onSubmittedWorkDone()
}

/** 复制纹理到暂存缓冲区 */
async function copyTextureToStagingBuffer(
    device: GPUDevice,
    outputTexture: GPUTexture,
    outputBuffer: GPUBuffer,
    stagingBuffer: GPUBuffer,
    width: number,
    height: number,
    alignedBytesPerRow: number,
    bufferSize: number
): Promise<void> {
    const encoder = device.createCommandEncoder({ label: 'copy_encoder' })

    encoder.copyTextureToBuffer(
        { texture: outputTexture },
        { buffer: outputBuffer, bytesPerRow: alignedBytesPerRow, rowsPerImage: height },
        { width, height, depthOrArrayLayers: 1 }
    )

    encoder.copyBufferToBuffer(outputBuffer, 0, stagingBuffer, 0, bufferSize)

    device.queue.submit([encoder.finish()])
    await device.queue.onSubmittedWorkDone()
}

/** 从暂存缓冲区读取结果 */
async function readResultFromStagingBuffer(
    stagingBuffer: GPUBuffer,
    outputBuffer: GPUBuffer,
    width: number,
    height: number,
    alignedBytesPerRow: number
): Promise<ImageData> {
    await stagingBuffer.mapAsync(GPUMapMode.READ)
    const mappedRange = new Uint8Array(stagingBuffer.getMappedRange())
    const finalResult = new Uint8ClampedArray(width * height * BYTES_PER_PIXEL)

    for (let y = 0; y < height; y++) {
        const sourceOffset = y * alignedBytesPerRow
        const targetOffset = y * width * BYTES_PER_PIXEL
        finalResult.set(
            mappedRange.subarray(sourceOffset, sourceOffset + width * BYTES_PER_PIXEL),
            targetOffset
        )
    }

    stagingBuffer.unmap()
    stagingBuffer.destroy()
    outputBuffer.destroy()

    return new ImageData(finalResult, width, height)
}

/** 执行 GPU 计算 */
export async function executeGPUComputation(ctx: ExposureContext): Promise<ImageData> {
    const { device, pipeline, bindGroupLayout, uniformBuffer,
        inputTexture, outputTexture, histogramBuffer, cdfBuffer, width, height } = ctx

    if (!device || !pipeline || !bindGroupLayout || !uniformBuffer ||
        !inputTexture || !outputTexture || !histogramBuffer || !cdfBuffer) {
        throw new Error('ExposureContext 缺少必要的 GPU 资源')
    }

    try {
        const alignedBytesPerRow = getAlignedBytesPerRow(width)
        const bufferSize = alignedBytesPerRow * height
        const { stagingBuffer, outputBuffer } = createComputeBuffers(device, bufferSize)

        await executeComputePass(ctx)
        await copyTextureToStagingBuffer(
            device, outputTexture, outputBuffer, stagingBuffer,
            width, height, alignedBytesPerRow, bufferSize
        )

        return await readResultFromStagingBuffer(
            stagingBuffer, outputBuffer, width, height, alignedBytesPerRow
        )
    } catch (error) {
        console.error('GPU计算执行失败:', error)
        throw error
    }
}

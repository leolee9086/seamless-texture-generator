/**
 * GPU 手动曝光调整
 * 直接在 GPUBuffer 上操作，避免 GPU↔CPU 往返
 */
import { 手动曝光着色器代码 } from './exposureAdjustment.manual.code'

/** 管线和资源缓存 */
let 缓存管线: GPUComputePipeline | null = null
let 缓存bindGroupLayout: GPUBindGroupLayout | null = null
let 缓存Device: GPUDevice | null = null

/**
 * 获取或创建手动曝光管线
 */
async function 获取管线(device: GPUDevice): Promise<{
    pipeline: GPUComputePipeline
    bindGroupLayout: GPUBindGroupLayout
}> {
    // 检查缓存是否有效
    if (缓存管线 && 缓存bindGroupLayout && 缓存Device === device) {
        return { pipeline: 缓存管线, bindGroupLayout: 缓存bindGroupLayout }
    }

    // 创建 bind group layout
    const bindGroupLayout = device.createBindGroupLayout({
        entries: [
            { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
            { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
            { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
        ]
    })

    const pipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [bindGroupLayout]
    })

    const pipeline = await device.createComputePipelineAsync({
        layout: pipelineLayout,
        compute: {
            module: device.createShaderModule({ code: 手动曝光着色器代码 }),
            entryPoint: 'main'
        }
    })

    // 更新缓存
    缓存管线 = pipeline
    缓存bindGroupLayout = bindGroupLayout
    缓存Device = device

    return { pipeline, bindGroupLayout }
}

/**
 * GPU 手动曝光调整 - 直接操作 GPUBuffer
 */
export async function GPU手动曝光调整(
    device: GPUDevice,
    inputBuffer: GPUBuffer,
    width: number,
    height: number,
    exposure: number,
    contrast: number,
    gamma: number
): Promise<GPUBuffer> {
    const 像素总数 = width * height
    const bufferSize = 像素总数 * 4 // RGBA8 = 4 bytes per pixel

    // 获取管线
    const { pipeline, bindGroupLayout } = await 获取管线(device)

    // 创建 uniform buffer
    const uniformBuffer = device.createBuffer({
        size: 16, // 4 个 f32/u32 (4字节 * 4 = 16字节)
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    })

    // 写入参数
    const uniformData = new ArrayBuffer(16)
    const uniformView = new DataView(uniformData)
    uniformView.setFloat32(0, exposure, true)
    uniformView.setFloat32(4, contrast, true)
    uniformView.setFloat32(8, gamma, true)
    uniformView.setUint32(12, 像素总数, true)
    device.queue.writeBuffer(uniformBuffer, 0, uniformData)

    // 创建输出 buffer
    const outputBuffer = device.createBuffer({
        size: bufferSize,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST
    })

    // 创建 bind group
    const bindGroup = device.createBindGroup({
        layout: bindGroupLayout,
        entries: [
            { binding: 0, resource: { buffer: uniformBuffer } },
            { binding: 1, resource: { buffer: inputBuffer } },
            { binding: 2, resource: { buffer: outputBuffer } },
        ]
    })

    // 执行计算
    const encoder = device.createCommandEncoder()
    const pass = encoder.beginComputePass()
    pass.setPipeline(pipeline)
    pass.setBindGroup(0, bindGroup)
    pass.dispatchWorkgroups(Math.ceil(像素总数 / 256))
    pass.end()

    device.queue.submit([encoder.finish()])
    await device.queue.onSubmittedWorkDone()

    // 清理临时资源
    uniformBuffer.destroy()

    return outputBuffer
}

/** 英文别名导出 */
export const gpuManualExposureAdjust = GPU手动曝光调整

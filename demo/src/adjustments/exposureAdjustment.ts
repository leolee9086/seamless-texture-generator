import type { HSLAdjustmentLayer } from './hsl/hslAdjustStep'

export interface ExposureAdjustmentParams {
    strength: number
    targetExposure: number
    localAdjustFactor: number
}

export interface ExposureHistogramData {
    brightness: Uint32Array
    totalPixels: number
}

// WebGPU 着色器代码
const autoExposureShader = `
struct Uniforms {
    width: u32,
    height: u32,
    strength: f32,
    targetExposure: f32,
    localAdjustFactor: f32,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var inputTexture: texture_2d<f32>;
@group(0) @binding(2) var outputTexture: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(3) var<storage, read> histogram: array<u32, 256>;
@group(0) @binding(4) var<storage, read> cdf: array<f32, 256>;

@compute @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let pixel_coord = vec2<i32>(global_id.xy);
    if (pixel_coord.x >= i32(uniforms.width) || pixel_coord.y >= i32(uniforms.height)) {
        return;
    }

    let color = textureLoad(inputTexture, pixel_coord, 0);
    let luminance = dot(color.rgb, vec3<f32>(0.299, 0.587, 0.114));
    
    let luminanceDiff = abs(luminance - 0.5) * 2.0;
    let luminanceIndex = u32(luminance * 255.0);
    
    let protectionFactor = sqrt(luminanceDiff);
    let targetBaseLuminance = cdf[luminanceIndex];
    let targetLuminance = mix(targetBaseLuminance, luminance, protectionFactor);
    
    let sigmoid = 1.0 / (1.0 + exp(-8.0 * (luminance - 0.5)));
    let adjustmentStrength = 0.5 + sigmoid * 0.5;
    
    let baseLuminanceAdjust = uniforms.strength * (targetLuminance - luminance + uniforms.targetExposure);
    let luminanceAdjust = baseLuminanceAdjust * adjustmentStrength;
    
    let adjustmentFactor = 1.0 + (uniforms.localAdjustFactor * 0.2);
    let fineAdjust = luminanceAdjust * adjustmentFactor;
    
    let baseLimit = 45.0 / 255.0;
    let dynamicLimit = baseLimit * (1.0 - luminanceDiff * luminanceDiff);
    let limitedAdjust = clamp(fineAdjust, -dynamicLimit, dynamicLimit);
    
    let newColor = clamp(color.rgb + vec3<f32>(limitedAdjust), vec3<f32>(0.0), vec3<f32>(1.0));
    textureStore(outputTexture, pixel_coord, vec4<f32>(newColor, color.a));
}
`

// 资源池类，用于管理GPU资源
class ResourcePool {
    public device: GPUDevice
    private buffers = new Map<string, { buffer: GPUBuffer; refCount: number }>()
    private textures = new Map<string, { texture: GPUTexture; refCount: number }>()
    private mappedBuffers = new Set<GPUBuffer>()

    constructor(device: GPUDevice) {
        this.device = device
    }

    async getBuffer(size: number, usage: GPUBufferUsageFlags, label = ''): Promise<GPUBuffer> {
        const key = `${size}_${usage}_${label}`
        let buffer: GPUBuffer | undefined

        if (this.buffers.has(key)) {
            const bufferEntry = this.buffers.get(key)!
            buffer = bufferEntry.buffer
            bufferEntry.refCount++

            if (buffer) {
                // 如果缓冲区已映射，尝试取消映射
                if (this.mappedBuffers.has(buffer)) {
                    try {
                        buffer.unmap()
                        this.mappedBuffers.delete(buffer)
                    } catch (e) {
                        // 忽略未映射缓冲区的错误
                    }
                }
                return buffer
            }
        }

        // 创建新的缓冲区
        buffer = this.device.createBuffer({
            size,
            usage,
            label: `pool_buffer_${label}`
        })

        this.buffers.set(key, { buffer, refCount: 1 })

        return buffer
    }

    markBufferMapped(buffer: GPUBuffer): void {
        this.mappedBuffers.add(buffer)
    }

    markBufferUnmapped(buffer: GPUBuffer): void {
        this.mappedBuffers.delete(buffer)
    }

    getTexture(width: number, height: number, format: GPUTextureFormat, usage: GPUTextureUsageFlags, label = ''): GPUTexture {
        const key = `${width}_${height}_${format}_${usage}_${label}`
        if (this.textures.has(key)) {
            const textureEntry = this.textures.get(key)!
            textureEntry.refCount++
            return textureEntry.texture
        }

        // 创建新的纹理
        const texture = this.device.createTexture({
            size: [width, height],
            format,
            usage,
            label: `pool_texture_${label}`
        })

        this.textures.set(key, { texture, refCount: 1 })
        return texture
    }

    releaseBuffer(buffer: GPUBuffer): void {
        for (const [key, entry] of this.buffers.entries()) {
            if (entry.buffer === buffer) {
                entry.refCount--
                if (entry.refCount <= 0) {
                    if (this.mappedBuffers.has(buffer)) {
                        try {
                            buffer.unmap()
                        } catch (e) {
                            // 忽略清理错误
                        }
                        this.mappedBuffers.delete(buffer)
                    }
                    this.buffers.delete(key)
                }
                break
            }
        }
    }

    releaseTexture(texture: GPUTexture): void {
        for (const [key, entry] of this.textures.entries()) {
            if (entry.texture === texture) {
                entry.refCount--
                if (entry.refCount <= 0) {
                    this.textures.delete(key)
                }
                break
            }
        }
    }
}

// 全局资源池实例
let resourcePool: ResourcePool | null = null

// 初始化GPU设备和资源池
async function initializeGPU(): Promise<GPUDevice> {
    if (!navigator.gpu) {
        throw new Error('WebGPU not supported')
    }

    const adapter = await navigator.gpu.requestAdapter()
    if (!adapter) {
        throw new Error('Failed to get GPU adapter')
    }

    const device = await adapter.requestDevice()
    resourcePool = new ResourcePool(device)
    return device
}

// 创建自动曝光GPU管线
async function createAutoExposurePipeline(device: GPUDevice, _width: number, _height: number) {
    if (!device) {
        throw new Error('GPU设备未初始化')
    }

    try {
        // 创建绑定组布局
        const bindGroupLayout = device.createBindGroupLayout({
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

        // 创建管线布局
        const pipelineLayout = device.createPipelineLayout({
            bindGroupLayouts: [bindGroupLayout]
        })

        // 创建管线
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

// 创建输入纹理
async function createInputTexture(device: GPUDevice, imageData: ImageData, width: number, height: number): Promise<GPUTexture> {
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

// 创建输出纹理
function createOutputTexture(device: GPUDevice, width: number, height: number): GPUTexture {
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

// 计算曝光调整参数
function calculateExposureParams(histogram: Uint32Array): ExposureAdjustmentParams {
    const totalPixels = histogram.reduce((sum, count) => sum + count, 0)

    // 计算CDF
    const cdf = new Float32Array(256)
    let sum = 0
    for (let i = 0; i < 256; i++) {
        sum += histogram[i]
        cdf[i] = sum / totalPixels
    }

    // 计算平均亮度
    let weightedSum = 0
    for (let i = 0; i < 256; i++) {
        weightedSum += (i / 255.0) * histogram[i]
    }
    const averageLuminance = weightedSum / totalPixels

    // 根据特征调整目标曝光值
    let targetExposure = 0.5 - averageLuminance

    // 分析直方图特征
    const features = analyzeHistogramFeatures(histogram)

    // 如果有明显的峰值，向该方向适当调整
    if (features.peakBin < 0.3) {
        // 暗部有峰值，增加曝光补偿
        targetExposure *= 1.2
    } else if (features.peakBin > 0.7) {
        // 亮部有峰值，减少曝光补偿
        targetExposure *= 0.8
    }

    // 计算局部调整因子
    const variance = calculateVariance(histogram, averageLuminance, totalPixels)
    let localAdjustFactor = calculateLocalAdjustFactor(variance)

    // 根据特征调整局部因子
    if (features.darkRatio > 0.4 || features.brightRatio > 0.4) {
        // 在极端情况下减少局部调整以避免过度处理
        localAdjustFactor *= 0.8
    }

    return {
        strength: 1.0,
        targetExposure,
        localAdjustFactor
    }
}

// 计算方差
function calculateVariance(histogram: Uint32Array, mean: number, totalPixels: number): number {
    let variance = 0
    for (let i = 0; i < 256; i++) {
        const normalizedValue = i / 255.0
        const diff = normalizedValue - mean
        variance += (diff * diff) * histogram[i]
    }
    return variance / totalPixels
}

// 计算局部调整因子
function calculateLocalAdjustFactor(variance: number): number {
    // 基于方差调整局部因子
    // 方差越大，说明图像对比度越高，需要更温和的调整
    const baseAdjustment = 1.0
    const varianceWeight = Math.min(variance * 4.0, 1.0)
    return baseAdjustment * (1.0 - varianceWeight * 0.5)
}

// 分析直方图特征
function analyzeHistogramFeatures(histogram: Uint32Array) {
    const totalPixels = histogram.reduce((sum, count) => sum + count, 0)

    // 找到最大值和最小值的位置
    let maxBin = 0
    let maxCount = 0
    let darkPixels = 0
    let brightPixels = 0

    for (let i = 0; i < 256; i++) {
        if (histogram[i] > maxCount) {
            maxCount = histogram[i]
            maxBin = i
        }

        if (i < 64) {
            darkPixels += histogram[i]
        }
        if (i > 192) {
            brightPixels += histogram[i]
        }
    }

    return {
        peakBin: maxBin / 255.0,
        darkRatio: darkPixels / totalPixels,
        brightRatio: brightPixels / totalPixels
    }
}

// 创建并设置缓冲区
async function createAndSetupBuffers(device: GPUDevice, histogram: Uint32Array, cdf: Float32Array) {
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

// 执行GPU计算
async function executeGPUComputation(
    device: GPUDevice,
    pipeline: GPUComputePipeline,
    bindGroupLayout: GPUBindGroupLayout,
    uniformBuffer: GPUBuffer,
    inputTexture: GPUTexture,
    outputTexture: GPUTexture,
    histogramBuffer: GPUBuffer,
    cdfBuffer: GPUBuffer,
    width: number,
    height: number
): Promise<ImageData> {
    try {
        const workgroupSize = 16
        const bytesPerPixel = 4
        const alignedBytesPerRow = Math.ceil(width * bytesPerPixel / 256) * 256
        const bufferSize = alignedBytesPerRow * height

        // 创建 staging buffer
        const stagingBuffer = device.createBuffer({
            size: bufferSize,
            usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
            label: 'staging_buffer'
        })

        // 创建一个临时的输出缓冲区
        const outputBuffer = device.createBuffer({
            size: bufferSize,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
            label: 'output_buffer'
        })

        // 第一个命令编码器：执行计算
        const computeEncoder = device.createCommandEncoder({
            label: 'compute_encoder'
        })

        const bindGroup = device.createBindGroup({
            layout: bindGroupLayout,
            entries: [
                { binding: 0, resource: { buffer: uniformBuffer } },
                { binding: 1, resource: inputTexture.createView() },
                { binding: 2, resource: outputTexture.createView() },
                { binding: 3, resource: { buffer: histogramBuffer } },
                { binding: 4, resource: { buffer: cdfBuffer } }
            ],
            label: 'auto_exposure_bind_group'
        })

        const computePass = computeEncoder.beginComputePass({
            label: 'compute_pass'
        })
        computePass.setPipeline(pipeline)
        computePass.setBindGroup(0, bindGroup)
        computePass.dispatchWorkgroups(
            Math.ceil(width / workgroupSize),
            Math.ceil(height / workgroupSize)
        )
        computePass.end()

        // 提交计算命令
        device.queue.submit([computeEncoder.finish()])
        await device.queue.onSubmittedWorkDone()

        // 第二个命令编码器：复制数据
        const copyEncoder = device.createCommandEncoder({
            label: 'copy_encoder'
        })

        // 从输出纹理复制到输出缓冲区
        copyEncoder.copyTextureToBuffer(
            { texture: outputTexture },
            {
                buffer: outputBuffer,
                bytesPerRow: alignedBytesPerRow,
                rowsPerImage: height,
            },
            { width, height, depthOrArrayLayers: 1 }
        )

        // 从输出缓冲区复制到暂存缓冲区
        copyEncoder.copyBufferToBuffer(
            outputBuffer, 0,
            stagingBuffer, 0,
            bufferSize
        )

        // 提交复制命令
        device.queue.submit([copyEncoder.finish()])
        await device.queue.onSubmittedWorkDone()

        // 映射暂存缓冲区
        await stagingBuffer.mapAsync(GPUMapMode.READ)
        const mappedRange = new Uint8Array(stagingBuffer.getMappedRange())

        // 创建最终结果数组
        const finalResult = new Uint8ClampedArray(width * height * bytesPerPixel)

        // 复制数据，处理对齐问题
        for (let y = 0; y < height; y++) {
            const sourceOffset = y * alignedBytesPerRow
            const targetOffset = y * width * bytesPerPixel
            finalResult.set(
                mappedRange.subarray(
                    sourceOffset,
                    sourceOffset + width * bytesPerPixel
                ),
                targetOffset
            )
        }

        // 清理资源
        stagingBuffer.unmap()
        stagingBuffer.destroy()
        outputBuffer.destroy()

        // 返回 ImageData
        return new ImageData(finalResult, width, height)

    } catch (error) {
        console.error('GPU计算执行失败:', error)
        throw error
    }
}

// 计算图像直方图
function calculateHistogram(imageData: ImageData): Uint32Array {
    const histogram = new Uint32Array(256)
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
        // 计算亮度值 (使用标准权重)
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        const luminance = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
        histogram[luminance]++
    }

    return histogram
}

// 主要的曝光调整函数
export async function adjustExposure(
    imageData: ImageData,
    strength: number = 1.0
): Promise<ImageData> {
    if (!resourcePool) {
        await initializeGPU()
    }

    const device = resourcePool!.device
    const { width, height } = imageData

    try {
        // 计算直方图
        const histogram = calculateHistogram(imageData)

        // 计算曝光调整参数
        const params = calculateExposureParams(histogram)
        params.strength = strength

        // 计算CDF
        const totalPixels = histogram.reduce((sum, count) => sum + count, 0)
        const cdf = new Float32Array(256)
        let sum = 0
        for (let i = 0; i < 256; i++) {
            sum += histogram[i]
            cdf[i] = sum / totalPixels
        }

        // 创建GPU资源
        const { pipeline, uniformBuffer, bindGroupLayout } = await createAutoExposurePipeline(device, width, height)
        const inputTexture = await createInputTexture(device, imageData, width, height)
        const outputTexture = createOutputTexture(device, width, height)
        const { histogramBuffer, cdfBuffer } = await createAndSetupBuffers(device, histogram, cdf)

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
        const result = await executeGPUComputation(
            device,
            pipeline,
            bindGroupLayout,
            uniformBuffer,
            inputTexture,
            outputTexture,
            histogramBuffer,
            cdfBuffer,
            width,
            height
        )

        // 清理资源
        uniformBuffer.destroy()
        inputTexture.destroy()
        outputTexture.destroy()
        histogramBuffer.destroy()
        cdfBuffer.destroy()

        return result

    } catch (error) {
        console.error('曝光调整失败:', error)
        throw error
    }
}

// 手动曝光调整函数
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

// 将曝光调整转换为HSL调整层
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
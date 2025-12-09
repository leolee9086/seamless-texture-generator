import type {
    GrayscaleCompositorParams,
    CompositeWithMaskParams,
    CreateTexturesParams,
    ExecuteComputeShaderParams,
    BufferToDataURLParams,
    CleanupGPUResourcesParams,
    CreateComputePipelineParams
} from './types'
import { getWebGPUDevice } from './imports'
import {
    IMAGE_CONSTANTS,
    CANVAS_CONSTANTS,
    GPU_CONSTANTS,
    GPU_BINDING_CONSTANTS,
    BLEND_MODE_MAP,
    WORKGROUP_SIZE
} from './compositor.constants'

export type { GrayscaleCompositorParams }

/**
 * 默认合成器参数
 */
export const defaultCompositorParams: GrayscaleCompositorParams = {
    threshold: 0.5,          // 中间阈值
    softness: 0.2,           // 中等柔和度
    contrast: 1.0,           // 正常对比度
    invert: false,           // 不反转

    blendMode: 'normal',     // 正常混合
    opacity: 1.0,            // 完全不透明

    maskBias: 0.0,           // 无偏移
    maskGamma: 1.0           // 无Gamma校正
}

/**
 * 从URL或DataURL加载图片到ImageBitmap
 */
async function loadImage(source: string): Promise<ImageBitmap> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = IMAGE_CONSTANTS.CROSS_ORIGIN
        img.onload = (): void => {
            createImageBitmap(img).then(resolve).catch(reject)
        }
        img.onerror = (error): void => reject(new Error(IMAGE_CONSTANTS.FAILED_TO_LOAD_IMAGE+error.toString()))
        img.src = source
    })
}

/**
 * 将ImageBitmap缩放到指定尺寸
 */
async function resizeImageBitmap(bitmap: ImageBitmap, targetWidth: number, targetHeight: number): Promise<ImageBitmap> {
    // 如果尺寸已经匹配，直接返回
    if (bitmap.width === targetWidth && bitmap.height === targetHeight) {
        return bitmap
    }

    // 使用canvas进行缩放
    const canvas = document.createElement(CANVAS_CONSTANTS.ELEMENT_TYPE)
    canvas.width = targetWidth
    canvas.height = targetHeight
    const ctx = canvas.getContext(CANVAS_CONSTANTS.CONTEXT_TYPE)!
    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight)

    return createImageBitmap(canvas)
}

/**
 * 将ImageBitmap转换为GPUTexture
 */
function imageBitmapToTexture(device: GPUDevice, bitmap: ImageBitmap): GPUTexture {
    const texture = device.createTexture({
        size: [bitmap.width, bitmap.height],
        format: GPU_CONSTANTS.TEXTURE_FORMAT,
        usage: GPUTextureUsage.TEXTURE_BINDING |
            GPUTextureUsage.COPY_DST |
            GPUTextureUsage.RENDER_ATTACHMENT
    })

    device.queue.copyExternalImageToTexture(
        { source: bitmap },
        { texture },
        [bitmap.width, bitmap.height]
    )

    return texture
}

/**
 * 灰度蒙版合成器
 * 所有图片将以蒙版的尺寸为基准进行对齐
 * @param imageASource 图片A的URL或DataURL
 * @param imageBSource 图片B的URL或DataURL
 * @param maskSource 蒙版图片的URL或DataURL（灰度图）
 * @param params 合成参数
 * @param outputWidth 输出宽度（可选，默认使用蒙版的宽度）
 * @param outputHeight 输出高度（可选，默认使用蒙版的高度）
 */

/**
 * 创建GPU纹理
 */
function createTextures(
    params: CreateTexturesParams
): { textureA: GPUTexture; textureB: GPUTexture; textureMask: GPUTexture; outputTexture: GPUTexture } {
    const { device, bitmapA, bitmapB, bitmapMask, width, height } = params
    const textureA = imageBitmapToTexture(device, bitmapA)
    const textureB = imageBitmapToTexture(device, bitmapB)
    const textureMask = imageBitmapToTexture(device, bitmapMask)

    const outputTexture = device.createTexture({
        size: [width, height],
        format: GPU_CONSTANTS.TEXTURE_FORMAT,
        usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_SRC
    })

    return { textureA, textureB, textureMask, outputTexture }
}

/**
 * 创建uniform buffer
 */
function createUniformBuffer(
    device: GPUDevice,
    params: GrayscaleCompositorParams
): GPUBuffer {
    const uniformData = new Float32Array(12)
    uniformData[0] = params.threshold
    uniformData[1] = params.softness
    uniformData[2] = params.contrast
    uniformData[3] = params.invert ? 1.0 : 0.0

    const blendModeCode = BLEND_MODE_MAP[params.blendMode]
    uniformData[4] = blendModeCode
    uniformData[5] = params.opacity
    uniformData[6] = params.maskBias
    uniformData[7] = params.maskGamma
    // padding
    uniformData[8] = 0.0
    uniformData[9] = 0.0
    uniformData[10] = 0.0
    uniformData[11] = 0.0

    const uniformBuffer = device.createBuffer({
        size: uniformData.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    })
    device.queue.writeBuffer(uniformBuffer, 0, uniformData)

    return uniformBuffer
}

/**
 * 创建计算管线
 */
function createComputePipeline(params: CreateComputePipelineParams): GPUComputePipeline {
    const { device, wgslCode } = params
    const shaderModule = device.createShaderModule({ code: wgslCode })

    const computeBindGroupLayout = device.createBindGroupLayout({
        entries: [
            { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: GPU_BINDING_CONSTANTS.BUFFER_TYPE_UNIFORM } },
            { binding: 1, visibility: GPUShaderStage.COMPUTE, texture: { sampleType: GPU_BINDING_CONSTANTS.TEXTURE_SAMPLE_TYPE_FLOAT } },
            { binding: 2, visibility: GPUShaderStage.COMPUTE, texture: { sampleType: GPU_BINDING_CONSTANTS.TEXTURE_SAMPLE_TYPE_FLOAT } },
            { binding: 3, visibility: GPUShaderStage.COMPUTE, texture: { sampleType: GPU_BINDING_CONSTANTS.TEXTURE_SAMPLE_TYPE_FLOAT } },
            { binding: 4, visibility: GPUShaderStage.COMPUTE, storageTexture: { access: GPU_BINDING_CONSTANTS.STORAGE_TEXTURE_ACCESS_WRITE_ONLY, format: GPU_CONSTANTS.TEXTURE_FORMAT } }
        ]
    })

    const computePipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [computeBindGroupLayout]
    })

    return device.createComputePipeline({
        layout: computePipelineLayout,
        compute: { module: shaderModule, entryPoint: GPU_BINDING_CONSTANTS.SHADER_ENTRY_POINT }
    })
}

/**
 * 执行计算着色器
 */
function executeComputeShader(
    params: ExecuteComputeShaderParams
): GPUBuffer {
    const { device, pipeline, uniformBuffer, textureA, textureB, textureMask, outputTexture, width, height } = params
    const bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: uniformBuffer } },
            { binding: 1, resource: textureA.createView() },
            { binding: 2, resource: textureB.createView() },
            { binding: 3, resource: textureMask.createView() },
            { binding: 4, resource: outputTexture.createView() }
        ]
    })

    const commandEncoder = device.createCommandEncoder()
    const computePass = commandEncoder.beginComputePass()
    computePass.setPipeline(pipeline)
    computePass.setBindGroup(0, bindGroup)

    const workgroupsX = Math.ceil(width / WORKGROUP_SIZE)
    const workgroupsY = Math.ceil(height / WORKGROUP_SIZE)
    computePass.dispatchWorkgroups(workgroupsX, workgroupsY)
    computePass.end()

    const bytesPerRow = Math.ceil(width * 4 / 256) * 256
    const readBuffer = device.createBuffer({
        size: bytesPerRow * height,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    })

    commandEncoder.copyTextureToBuffer(
        { texture: outputTexture },
        { buffer: readBuffer, bytesPerRow },
        [width, height]
    )

    device.queue.submit([commandEncoder.finish()])
    return readBuffer
}

/**
 * 将GPU缓冲区转换为DataURL
 */
async function bufferToDataURL(
    params: BufferToDataURLParams
): Promise<string> {
    const { readBuffer, width, height, bytesPerRow } = params
    await readBuffer.mapAsync(GPUMapMode.READ)

    const canvas = document.createElement(CANVAS_CONSTANTS.ELEMENT_TYPE)
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext(CANVAS_CONSTANTS.CONTEXT_TYPE)!
    const imageData = ctx.createImageData(width, height)
    const rawData = new Uint8Array(readBuffer.getMappedRange())

    for (let y = 0; y < height; y++) {
        const sourceOffset = y * bytesPerRow
        const destOffset = y * width * 4
        for (let x = 0; x < width; x++) {
            const s = sourceOffset + x * 4
            const d = destOffset + x * 4
            // RGBA (直接复制，无需转换)
            imageData.data[d] = rawData[s]         // R
            imageData.data[d + 1] = rawData[s + 1] // G
            imageData.data[d + 2] = rawData[s + 2] // B
            imageData.data[d + 3] = rawData[s + 3] // A
        }
    }

    ctx.putImageData(imageData, 0, 0)
    readBuffer.unmap()

    return canvas.toDataURL(CANVAS_CONSTANTS.OUTPUT_FORMAT)
}

/**
 * 清理GPU资源
 */
function cleanupGPUResources(
    params: CleanupGPUResourcesParams
): void {
    const { textureA, textureB, textureMask, outputTexture, uniformBuffer, readBuffer } = params
    textureA.destroy()
    textureB.destroy()
    textureMask.destroy()
    outputTexture.destroy()
    uniformBuffer.destroy()
    readBuffer.destroy()
}

export async function compositeWithMask(
    params: CompositeWithMaskParams
): Promise<string> {
    const { imageASource, imageBSource, maskSource, params: compositorParams, outputWidth, outputHeight, wgslCode } = params;
    const device = await getWebGPUDevice()
    if (!device) throw new Error(IMAGE_CONSTANTS.WEBGPU_NOT_SUPPORTED)

    // 1. 加载图片（不调整尺寸）
    const [bitmapA, bitmapB, bitmapMask] = await Promise.all([
        loadImage(imageASource),
        loadImage(imageBSource),
        loadImage(maskSource)
    ])

    // 使用蒙版的尺寸作为基准（如果没有指定输出尺寸）
    const width = outputWidth || bitmapMask.width
    const height = outputHeight || bitmapMask.height

    // 2. 调整图片尺寸到目标尺寸
    const [resizedA, resizedB, resizedMask] = await Promise.all([
        resizeImageBitmap(bitmapA, width, height),
        resizeImageBitmap(bitmapB, width, height),
        resizeImageBitmap(bitmapMask, width, height)
    ])

    // 3. 创建GPU纹理
    const { textureA, textureB, textureMask, outputTexture } = createTextures({
        device, bitmapA: resizedA, bitmapB: resizedB, bitmapMask: resizedMask, width, height
    })

    // 4. 创建uniform buffer
    const uniformBuffer = createUniformBuffer(device, compositorParams)

    // 5. 创建计算管线
    const pipeline = createComputePipeline({ device, wgslCode })

    // 6. 执行计算着色器
    const bytesPerRow = Math.ceil(width * 4 / 256) * 256
    const readBuffer = executeComputeShader({
        device, pipeline, uniformBuffer,
        textureA, textureB, textureMask, outputTexture,
        width, height
    })

    // 7. 转换为DataURL
    const dataUrl = await bufferToDataURL({ readBuffer, width, height, bytesPerRow })

    // 8. 清理资源
    cleanupGPUResources({ textureA, textureB, textureMask, outputTexture, uniformBuffer, readBuffer })

    return dataUrl
}

/**
 * 预设参数
 */
export const compositorPresets: Record<string, GrayscaleCompositorParams> = {
    // 柔和过渡
    soft: {
        ...defaultCompositorParams,
        threshold: 0.5,
        softness: 0.5,
        contrast: 0.8
    },

    // 硬边缘
    hard: {
        ...defaultCompositorParams,
        threshold: 0.5,
        softness: 0.05,
        contrast: 2.0
    },

    // 高对比度
    highContrast: {
        ...defaultCompositorParams,
        threshold: 0.5,
        softness: 0.2,
        contrast: 1.8,
        maskGamma: 0.7
    },

    // 反向蒙版
    inverted: {
        ...defaultCompositorParams,
        threshold: 0.5,
        softness: 0.2,
        contrast: 1.0,
        invert: true
    },

    // 正片叠底效果
    multiply: {
        ...defaultCompositorParams,
        threshold: 0.5,
        softness: 0.3,
        blendMode: 'multiply',
        opacity: 0.8
    },

    // 滤色效果
    screen: {
        ...defaultCompositorParams,
        threshold: 0.5,
        softness: 0.3,
        blendMode: 'screen',
        opacity: 0.8
    }
}

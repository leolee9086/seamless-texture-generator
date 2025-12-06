import { grayscaleCompositorWGSL, GrayscaleCompositorParams } from './compositor'
import { getWebGPUDevice } from '../../../utils/webgpu/webgpuDevice'

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
        img.crossOrigin = 'anonymous'
        img.onload = () => {
            createImageBitmap(img).then(resolve).catch(reject)
        }
        img.onerror = () => reject(new Error('Failed to load image'))
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
    const canvas = document.createElement('canvas')
    canvas.width = targetWidth
    canvas.height = targetHeight
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight)

    return createImageBitmap(canvas)
}

/**
 * 将ImageBitmap转换为GPUTexture
 */
function imageBitmapToTexture(device: GPUDevice, bitmap: ImageBitmap): GPUTexture {
    const texture = device.createTexture({
        size: [bitmap.width, bitmap.height],
        format: 'rgba8unorm',
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
export async function compositeWithMask(
    imageASource: string,
    imageBSource: string,
    maskSource: string,
    params: GrayscaleCompositorParams,
    outputWidth?: number,
    outputHeight?: number
): Promise<string> {
    const device = await getWebGPUDevice()
    if (!device) throw new Error('WebGPU不支持')

    // 1. 加载所有图片
    const [bitmapA, bitmapB, bitmapMask] = await Promise.all([
        loadImage(imageASource),
        loadImage(imageBSource),
        loadImage(maskSource)
    ])

    // 使用蒙版的尺寸作为基准（如果没有指定输出尺寸）
    const width = outputWidth || bitmapMask.width
    const height = outputHeight || bitmapMask.height

    // 2. 将所有图片调整到统一尺寸（以蒙版为基准）
    const [resizedA, resizedB, resizedMask] = await Promise.all([
        resizeImageBitmap(bitmapA, width, height),
        resizeImageBitmap(bitmapB, width, height),
        resizeImageBitmap(bitmapMask, width, height)
    ])

    // 3. 创建纹理
    const textureA = imageBitmapToTexture(device, resizedA)
    const textureB = imageBitmapToTexture(device, resizedB)
    const textureMask = imageBitmapToTexture(device, resizedMask)

    // 4. 创建输出纹理
    const outputTexture = device.createTexture({
        size: [width, height],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_SRC
    })

    // 5. 创建uniform buffer
    const uniformData = new Float32Array(12)
    uniformData[0] = params.threshold
    uniformData[1] = params.softness
    uniformData[2] = params.contrast
    uniformData[3] = params.invert ? 1.0 : 0.0

    // 混合模式编码
    let blendModeCode = 0.0
    switch (params.blendMode) {
        case 'normal': blendModeCode = 0.0; break
        case 'multiply': blendModeCode = 1.0; break
        case 'screen': blendModeCode = 2.0; break
        case 'overlay': blendModeCode = 3.0; break
    }
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

    // 6. 创建compute pipeline
    const shaderModule = device.createShaderModule({ code: grayscaleCompositorWGSL })

    const computeBindGroupLayout = device.createBindGroupLayout({
        entries: [
            { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
            { binding: 1, visibility: GPUShaderStage.COMPUTE, texture: { sampleType: 'float' } },
            { binding: 2, visibility: GPUShaderStage.COMPUTE, texture: { sampleType: 'float' } },
            { binding: 3, visibility: GPUShaderStage.COMPUTE, texture: { sampleType: 'float' } },
            { binding: 4, visibility: GPUShaderStage.COMPUTE, storageTexture: { access: 'write-only', format: 'rgba8unorm' } }
        ]
    })

    const computePipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [computeBindGroupLayout]
    })

    const computePipeline = device.createComputePipeline({
        layout: computePipelineLayout,
        compute: { module: shaderModule, entryPoint: 'cs_main' }
    })

    // 7. 创建bind group
    const bindGroup = device.createBindGroup({
        layout: computePipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: uniformBuffer } },
            { binding: 1, resource: textureA.createView() },
            { binding: 2, resource: textureB.createView() },
            { binding: 3, resource: textureMask.createView() },
            { binding: 4, resource: outputTexture.createView() }
        ]
    })

    // 8. 执行compute shader
    const commandEncoder = device.createCommandEncoder()
    const computePass = commandEncoder.beginComputePass()
    computePass.setPipeline(computePipeline)
    computePass.setBindGroup(0, bindGroup)

    const workgroupsX = Math.ceil(width / 8)
    const workgroupsY = Math.ceil(height / 8)
    computePass.dispatchWorkgroups(workgroupsX, workgroupsY)
    computePass.end()

    // 9. 读取结果
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
    await readBuffer.mapAsync(GPUMapMode.READ)

    // 10. 转换为DataURL
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!
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

    // 清理资源
    textureA.destroy()
    textureB.destroy()
    textureMask.destroy()
    outputTexture.destroy()
    uniformBuffer.destroy()
    readBuffer.destroy()

    return canvas.toDataURL('image/png')
}

/**
 * 预设参数
 */
export const compositorPresets = {
    // 柔和过渡
    soft: {
        ...defaultCompositorParams,
        threshold: 0.5,
        softness: 0.5,
        contrast: 0.8
    } as GrayscaleCompositorParams,

    // 硬边缘
    hard: {
        ...defaultCompositorParams,
        threshold: 0.5,
        softness: 0.05,
        contrast: 2.0
    } as GrayscaleCompositorParams,

    // 高对比度
    highContrast: {
        ...defaultCompositorParams,
        threshold: 0.5,
        softness: 0.2,
        contrast: 1.8,
        maskGamma: 0.7
    } as GrayscaleCompositorParams,

    // 反向蒙版
    inverted: {
        ...defaultCompositorParams,
        threshold: 0.5,
        softness: 0.2,
        contrast: 1.0,
        invert: true
    } as GrayscaleCompositorParams,

    // 正片叠底效果
    multiply: {
        ...defaultCompositorParams,
        threshold: 0.5,
        softness: 0.3,
        blendMode: 'multiply' as const,
        opacity: 0.8
    } as GrayscaleCompositorParams,

    // 滤色效果
    screen: {
        ...defaultCompositorParams,
        threshold: 0.5,
        softness: 0.3,
        blendMode: 'screen' as const,
        opacity: 0.8
    } as GrayscaleCompositorParams
}

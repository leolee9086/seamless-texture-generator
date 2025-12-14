/**
 * 清晰度调整工具函数
 * 基于Guided Filter算法实现图像清晰度增强 (WebGPU版)
 */
import type { ControlEvent } from './imports'
import { createUpdateDataEvent, executeGuidedFilter } from './imports'

// 类型导入
import type { ClarityParams, GPUCompositionContext, GPUTextureReadContext } from './clarityAdjustment.types'

// 常量导入（允许从 .constants.ts 进行值导入）
import { GPU资源标签, 纹理格式, 工作组大小, UNIFORM缓冲区大小, 管线配置 } from './clarityAdjustment.constants'

// 着色器代码导入（允许从 .code.ts 进行值导入）
import { 清晰度合成着色器 } from './clarityAdjustment.code'

// 预设导入（允许从 .presets.ts 进行值导入）
import { DEFAULT_CLARITY_PARAMS, CLARITY_PRESETS } from './clarityAdjustment.presets'

/**
 * 从 ImageData 创建纹理
 */
function createTextureFromImageData(device: GPUDevice, imageData: ImageData): GPUTexture {
  const { width, height, data } = imageData

  // 转换为 Float32Array (RGBA32F)
  const floatData = new Float32Array(width * height * 4)
  for (let i = 0; i < data.length; i += 4) {
    floatData[i] = data[i] / 255.0
    floatData[i + 1] = data[i + 1] / 255.0
    floatData[i + 2] = data[i + 2] / 255.0
    floatData[i + 3] = data[i + 3] / 255.0
  }

  const texture = device.createTexture({
    size: { width, height },
    format: 纹理格式.RGBA32Float,
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    label: GPU资源标签.输入纹理
  })

  device.queue.writeTexture(
    { texture },
    floatData,
    { bytesPerRow: width * 16 },
    { width, height }
  )

  return texture
}

/**
 * 从纹理读取数据到 ImageData
 */
async function readTextureToImageData(ctx: GPUTextureReadContext): Promise<ImageData> {
  const { device, texture, width, height } = ctx
  const rowBytes = width * 16
  const bytesPerRow = Math.ceil(rowBytes / 256) * 256
  const bufferSize = bytesPerRow * height

  const buffer = device.createBuffer({
    size: bufferSize,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    label: GPU资源标签.输出缓冲区
  })

  const encoder = device.createCommandEncoder()
  encoder.copyTextureToBuffer(
    { texture },
    { buffer, bytesPerRow },
    { width, height }
  )
  device.queue.submit([encoder.finish()])

  await device.queue.onSubmittedWorkDone()
  await buffer.mapAsync(GPUMapMode.READ)

  const mapped = new Float32Array(buffer.getMappedRange())
  const outputData = new Uint8ClampedArray(width * height * 4)

  const floatsPerRow = width * 4
  const floatsPerRowPadded = bytesPerRow / 4

  for (let y = 0; y < height; y++) {
    const srcOffset = y * floatsPerRowPadded
    const dstOffset = y * floatsPerRow
    for (let x = 0; x < floatsPerRow; x++) {
      const val = mapped[srcOffset + x]
      outputData[dstOffset + x] = Math.max(0, Math.min(255, Math.round(val * 255)))
    }
  }

  buffer.unmap()
  buffer.destroy()

  return new ImageData(outputData, width, height)
}

/** 创建输出纹理 */
function createOutputTexture(device: GPUDevice, width: number, height: number): GPUTexture {
  return device.createTexture({
    size: { width, height },
    format: 纹理格式.RGBA32Float,
    usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_SRC,
    label: GPU资源标签.合成结果
  })
}

/** 创建并填充Uniform缓冲区 */
function createUniformBuffer(device: GPUDevice, params: ClarityParams): GPUBuffer {
  const uniformBuffer = device.createBuffer({
    size: UNIFORM缓冲区大小,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    label: GPU资源标签.合成Uniform
  })

  const uniformData = new Float32Array([
    params.detailStrength,
    params.enhancementStrength,
    params.macroEnhancement || 0.0,
    params.contrastBoost || 1.2,
    0, 0, 0, 0,  // padding to align to vec4
    0, 0, 0, 0   // padding
  ])
  device.queue.writeBuffer(uniformBuffer, 0, uniformData)
  return uniformBuffer
}

/** 创建计算管线 */
function createCompositionPipeline(device: GPUDevice): GPUComputePipeline {
  const shaderModule = device.createShaderModule({
    code: 清晰度合成着色器,
    label: GPU资源标签.合成着色器
  })

  return device.createComputePipeline({
    layout: 管线配置.布局,
    compute: {
      module: shaderModule,
      entryPoint: 管线配置.入口点
    },
    label: GPU资源标签.合成管线
  })
}

/**
 * 使用GPU进行智能合成
 */
async function performGPUComposition(ctx: GPUCompositionContext): Promise<GPUTexture> {
  const { device, width, height, params } = ctx

  // 创建资源
  const outputTexture = createOutputTexture(device, width, height)
  const uniformBuffer = createUniformBuffer(device, params)
  const pipeline = createCompositionPipeline(device)

  // 创建BindGroup（内联以避免参数过多）
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: ctx.originalTexture.createView() },
      { binding: 1, resource: ctx.baseTexture.createView() },
      { binding: 2, resource: ctx.detailTexture.createView() },
      { binding: 3, resource: outputTexture.createView() },
      { binding: 4, resource: { buffer: uniformBuffer } }
    ]
  })

  // 执行计算
  const encoder = device.createCommandEncoder({ label: GPU资源标签.合成编码器 })
  const pass = encoder.beginComputePass({ label: GPU资源标签.合成Pass })
  pass.setPipeline(pipeline)
  pass.setBindGroup(0, bindGroup)

  const dispatchX = Math.ceil(width / 工作组大小)
  const dispatchY = Math.ceil(height / 工作组大小)
  pass.dispatchWorkgroups(dispatchX, dispatchY)
  pass.end()

  device.queue.submit([encoder.finish()])
  await device.queue.onSubmittedWorkDone()

  return outputTexture
}

/**
 * 处理清晰度调整
 * @param device WebGPU设备
 * @param imageData 图像数据
 * @param params 清晰度参数
 * @returns 处理后的图像数据
 */
export async function processClarityAdjustment(
  device: GPUDevice,
  imageData: ImageData,
  params: ClarityParams
): Promise<ImageData> {
  try {
    const { width, height } = imageData

    // 1. 创建原始纹理
    const originalTexture = createTextureFromImageData(device, imageData)

    // 2. 执行 Guided Filter
    const guidedFilterParams = {
      sigma: params.sigma,
      epsilon: params.epsilon,
      radius: params.radius,
      blockSize: params.blockSize
    }

    // 调用库函数
    const filterResult = await executeGuidedFilter(device, originalTexture, guidedFilterParams, width, height)
    const { baseTexture, detailTexture } = filterResult

    // 3. 执行合成
    const compositionCtx: GPUCompositionContext = {
      device,
      originalTexture,
      baseTexture,
      detailTexture,
      params,
      width,
      height
    }
    const outputTexture = await performGPUComposition(compositionCtx)

    // 4. 读取结果
    const readCtx: GPUTextureReadContext = { device, texture: outputTexture, width, height }
    const resultImageData = await readTextureToImageData(readCtx)

    // 清理资源
    originalTexture.destroy()
    baseTexture.destroy()
    detailTexture.destroy()
    outputTexture.destroy()

    return resultImageData
  } catch (error) {
    console.error('清晰度调整处理失败:', error)
    throw error
  }
}

/**
 * 创建清晰度调整事件
 * @param params 清晰度参数
 * @returns 控制事件
 */
export function createClarityAdjustmentEvent(params: ClarityParams): ControlEvent {
  return createUpdateDataEvent('clarity-adjustment', params)
}

/**
 * 获取预设参数
 * @param presetName 预设名称
 * @returns 预设参数
 */
export function getClarityPreset(presetName: keyof typeof CLARITY_PRESETS): ClarityParams {
  return CLARITY_PRESETS[presetName]?.params || DEFAULT_CLARITY_PARAMS
}

// 从 guard 文件导入验证函数（保持向后兼容）
import { validateClarityParams } from './clarityAdjustment.guard'
export { validateClarityParams }
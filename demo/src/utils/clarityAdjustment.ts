/**
 * 清晰度调整工具函数
 * 基于Guided Filter算法实现图像清晰度增强 (WebGPU版)
 */

import type { ControlEvent } from '../types/controlEvents'
import { createUpdateDataEvent } from '../types/controlEvents'
// @ts-ignore
import { executeGuidedFilter } from '@leolee9086/clarity-enhancement/src/algorithms/guided-filter.js'

// 清晰度调整参数接口
export interface ClarityParams {
  sigma: number          // 滤波强度 [1.0, 16.0]
  epsilon: number        // 正则化参数 [0.01, 0.1]
  radius: number         // 窗口半径 [4, 32]
  blockSize: number      // 线程组大小 [8, 32]
  detailStrength: number  // 细节强度 [0.1, 20.0]
  enhancementStrength: number // 增强强度 [0.1, 10.0]
  macroEnhancement: number // 宏观增强 [0.0, 2.0]
  contrastBoost: number   // 对比度增强 [1.0, 3.0]
}

// 默认清晰度参数
export const DEFAULT_CLARITY_PARAMS: ClarityParams = {
  sigma: 8.0,
  epsilon: 0.04,
  radius: 8,
  blockSize: 16,
  detailStrength: 2.0,
  enhancementStrength: 1.0,
  macroEnhancement: 0.0,
  contrastBoost: 1.2
}

// 预设配置
export const CLARITY_PRESETS = {
  subtle: {
    name: '轻微',
    params: {
      sigma: 6.0,
      epsilon: 0.03,
      radius: 6,
      blockSize: 16,
      detailStrength: 1.5,
      enhancementStrength: 0.8,
      macroEnhancement: 0.0,
      contrastBoost: 1.1
    } as ClarityParams
  },
  moderate: {
    name: '适中',
    params: {
      sigma: 8.0,
      epsilon: 0.04,
      radius: 8,
      blockSize: 16,
      detailStrength: 2.0,
      enhancementStrength: 1.0,
      macroEnhancement: 0.0,
      contrastBoost: 1.2
    } as ClarityParams
  },
  strong: {
    name: '强烈',
    params: {
      sigma: 10.0,
      epsilon: 0.05,
      radius: 10,
      blockSize: 16,
      detailStrength: 3.0,
      enhancementStrength: 1.5,
      macroEnhancement: 0.2,
      contrastBoost: 1.4
    } as ClarityParams
  },
  aggressive: {
    name: '激进',
    params: {
      sigma: 12.0,
      epsilon: 0.06,
      radius: 12,
      blockSize: 16,
      detailStrength: 4.0,
      enhancementStrength: 2.0,
      macroEnhancement: 0.3,
      contrastBoost: 1.6
    } as ClarityParams
  }
}

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
    format: 'rgba32float',
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    label: 'Clarity Input Texture'
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
async function readTextureToImageData(device: GPUDevice, texture: GPUTexture, width: number, height: number): Promise<ImageData> {
  const rowBytes = width * 16
  const bytesPerRow = Math.ceil(rowBytes / 256) * 256
  const bufferSize = bytesPerRow * height

  const buffer = device.createBuffer({
    size: bufferSize,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    label: 'Clarity Output Buffer'
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

/**
 * 使用GPU进行智能合成
 */
async function performGPUComposition(
  device: GPUDevice,
  originalTexture: GPUTexture,
  baseTexture: GPUTexture,
  detailTexture: GPUTexture,
  params: ClarityParams,
  width: number,
  height: number
): Promise<GPUTexture> {
  // 创建合成着色器
  const compositionShader = `
    struct CompositionParams {
        detailStrength: f32,
        enhancementStrength: f32,
        macroEnhancement: f32,
        contrastBoost: f32,
        padding1: vec4<f32>,
        padding2: vec4<f32>
    }

    @group(0) @binding(0) var originalTexture: texture_2d<f32>;
    @group(0) @binding(1) var baseTexture: texture_2d<f32>;
    @group(0) @binding(2) var detailTexture: texture_2d<f32>;
    @group(0) @binding(3) var outputTexture: texture_storage_2d<rgba32float, write>;
    @group(0) @binding(4) var<uniform> params: CompositionParams;

    @compute @workgroup_size(16, 16)
    fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
        let coord = vec2<i32>(global_id.xy);
        let dims = textureDimensions(originalTexture);
        
        if (coord.x >= i32(dims.x) || coord.y >= i32(dims.y)) {
            return;
        }
        
        // 采样纹理
        let original = textureLoad(originalTexture, coord, 0);
        let base = textureLoad(baseTexture, coord, 0);
        let detail = textureLoad(detailTexture, coord, 0);
        
        // 计算亮度
        let originalLum = dot(original.rgb, vec3<f32>(0.299, 0.587, 0.114));
        let baseLum = dot(base.rgb, vec3<f32>(0.299, 0.587, 0.114));
        
        // 计算偏差
        let brightnessDiff = abs(originalLum - baseLum);
        let contrastFactor = 1.0 - brightnessDiff * 0.7;
        
        // 智能强度调节（降低过度增强）
        let smartStrength = params.detailStrength * contrastFactor * 0.7;
        
        // 宏观增强
        let meanLum = baseLum;
        // 计算宏观增强（独立控制）
        var macroBase = base.rgb * params.contrastBoost;
        macroBase = clamp(macroBase, vec3<f32>(0.0), vec3<f32>(1.0));
        
        // 计算细节增强（限制增强幅度）
        let detailEnhanced = original.rgb + detail.rgb * smartStrength;
        
        // 混合宏观增强（增加权重影响）
        let macroWeight = params.macroEnhancement * 0.8; // 增强宏观效果
        let macroEnhanced = mix(detailEnhanced, macroBase, macroWeight);
        
        // 最终增强：使用加权混合而非乘法放大，增加对比度控制
        let contrastAdjusted = mix(original.rgb, macroEnhanced, params.enhancementStrength);
        
        // 应用对比度增强
        let meanValue = dot(contrastAdjusted, vec3<f32>(0.299, 0.587, 0.114));
        let contrastEnhanced = meanValue + (contrastAdjusted - meanValue) * (1.0 + params.contrastBoost * 0.5);
        
        var enhanced = clamp(contrastEnhanced, vec3<f32>(0.0), vec3<f32>(1.0));
        
        // 写入结果
        textureStore(outputTexture, coord, vec4<f32>(enhanced, original.a));
    }
  `

  // 创建输出纹理
  const outputTexture = device.createTexture({
    size: { width, height },
    format: 'rgba32float',
    usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_SRC,
    label: 'Composition Result'
  })

  // 创建uniform缓冲区
  const uniformBuffer = device.createBuffer({
    size: 48, // 3个vec4，每个16字节，共48字节
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    label: 'Composition Uniforms'
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

  // 创建着色器模块
  const shaderModule = device.createShaderModule({
    code: compositionShader,
    label: 'Composition Shader'
  })

  // 创建管线
  const pipeline = device.createComputePipeline({
    layout: 'auto',
    compute: {
      module: shaderModule,
      entryPoint: 'main'
    },
    label: 'Composition Pipeline'
  })

  // 创建bind group
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: originalTexture.createView() },
      { binding: 1, resource: baseTexture.createView() },
      { binding: 2, resource: detailTexture.createView() },
      { binding: 3, resource: outputTexture.createView() },
      { binding: 4, resource: { buffer: uniformBuffer } }
    ]
  })

  // 执行计算
  const encoder = device.createCommandEncoder({ label: 'Composition Encoder' })
  const pass = encoder.beginComputePass({ label: 'Composition Pass' })
  pass.setPipeline(pipeline)
  pass.setBindGroup(0, bindGroup)

  const dispatchX = Math.ceil(width / 16)
  const dispatchY = Math.ceil(height / 16)
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
    const outputTexture = await performGPUComposition(
      device,
      originalTexture,
      baseTexture,
      detailTexture,
      params,
      width,
      height
    )

    // 4. 读取结果
    const resultImageData = await readTextureToImageData(device, outputTexture, width, height)

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

/**
 * 验证清晰度参数
 * @param params 清晰度参数
 * @returns 是否有效
 */
export function validateClarityParams(params: Partial<ClarityParams>): params is ClarityParams {
  return (
    typeof params.sigma === 'number' && params.sigma >= 1.0 && params.sigma <= 16.0 &&
    typeof params.epsilon === 'number' && params.epsilon >= 0.01 && params.epsilon <= 0.1 &&
    typeof params.radius === 'number' && params.radius >= 4 && params.radius <= 32 &&
    typeof params.blockSize === 'number' && params.blockSize >= 8 && params.blockSize <= 32 &&
    typeof params.detailStrength === 'number' && params.detailStrength >= 0.1 && params.detailStrength <= 20.0 &&
    typeof params.enhancementStrength === 'number' && params.enhancementStrength >= 0.1 && params.enhancementStrength <= 10.0 &&
    typeof params.macroEnhancement === 'number' && params.macroEnhancement >= 0.0 && params.macroEnhancement <= 2.0 &&
    typeof params.contrastBoost === 'number' && params.contrastBoost >= 1.0 && params.contrastBoost <= 3.0
  )
}
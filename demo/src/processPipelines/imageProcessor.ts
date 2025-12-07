import { HSLAdjustProcessStep, type HSLAdjustmentLayer } from '../utils/hslAdjustStep'
import { adjustExposure, adjustExposureManual } from '../adjustments/exposureAdjustment'  // 新增导入
import { applyDehazeAdjustment, DEFAULT_DEHAZE_PARAMS } from '../adjustments/dehaze/dehazeAdjustment'  // 新增导入
import { type DehazeParams } from '@/adjustments/dehaze/types'
import { processClarityAdjustment, type ClarityParams } from '../adjustments/clarityAdjustment'  // 新增导入
import { applyLuminanceAdjustmentToImageData, type LuminanceAdjustmentParams } from '../adjustments/luminanceAdjustment'  // 新增导入
import { baseOptions, GeneralSynthesisPipelineStep, PipelineData } from '../types/PipelineData.type'
import { gpuBufferToImageData } from '../utils/webgpu/convert/gpuBufferToImageData'
import { ImageLoadStep } from './ImageLoadStep'
import { LUTProcessStep } from './LUTProcessStep'
import { TileableProcessStep } from './TileableProcessStep'
import { OutputConversionStep } from './OutputConversionStep'
/**
 * 管线步骤选项
 */
export interface PipelineOptions extends baseOptions {
  maxResolution?: number
  borderSize?: number
  lutFile?: File | null
  lutIntensity?: number
  maskData?: Uint8Array
  hslLayers?: HSLAdjustmentLayer[]
  exposureStrength?: number  // 新增
  exposureManual?: { exposure: number; contrast: number; gamma: number }  // 新增
  dehazeParams?: DehazeParams  // 新增
  clarityParams?: ClarityParams  // 新增
  luminanceParams?: LuminanceAdjustmentParams  // 新增
}

/**
 * 图片后处理管线步骤接口
 */
export interface ImageProcessPipelineStep extends GeneralSynthesisPipelineStep {
  execute(data: PipelineData, options: PipelineOptions): Promise<PipelineData>
}

/**
 * 工具函数：ImageData 转 GPUBuffer
 */
export async function imageDataToGPUBuffer(imageData: ImageData, device: GPUDevice): Promise<GPUBuffer> {
  const buffer = device.createBuffer({
    size: imageData.data.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true
  })
  new Uint8Array(buffer.getMappedRange()).set(imageData.data)
  buffer.unmap()
  return buffer
}

/**
 * 获取或初始化 WebGPU 设备
 */
let cachedDevice: GPUDevice | null = null
export async function getGPUDevice(): Promise<GPUDevice> {
  if (cachedDevice) return cachedDevice

  if (!navigator.gpu) {
    throw new Error('WebGPU 不支持')
  }

  const adapter = await navigator.gpu.requestAdapter()
  if (!adapter) {
    throw new Error('无法获取 GPU 适配器')
  }

  cachedDevice = await adapter.requestDevice()
  return cachedDevice
}

/**
 * 处理图像，使其可平铺
 * @param originalImage 原始图像URL
 * @param maxResolution 最大分辨率
 * @param borderSize 边界大小
 * @param onProcessingStart 处理开始回调
 * @param onProcessingEnd 处理结束回调
 * @param onError 错误回调
 * @returns 处理后的图像URL
 */
export async function processImageToTileable(
  originalImage: string,
  maxResolution: number,
  borderSize: number,
  onProcessingStart?: () => void,
  onProcessingEnd?: () => void,
  onError?: (message: string) => void,
  lutFile?: File | null,
  lutIntensity?: number,
  maskData?: Uint8Array,
  hslLayers?: HSLAdjustmentLayer[],
  exposureStrength?: number,  // 新增参数
  exposureManual?: { exposure: number; contrast: number; gamma: number },  // 新增参数
  dehazeParams?: DehazeParams,  // 新增参数
  clarityParams?: ClarityParams,  // 新增参数
  luminanceParams?: LuminanceAdjustmentParams  // 新增参数

): Promise<string> {
  if (!originalImage) {
    throw new Error('原始图像不能为空')
  }

  onProcessingStart?.()

  try {
    // 构建管线选项
    const options: PipelineOptions = {
      maxResolution,
      borderSize,
      lutFile,
      lutIntensity,
      maskData,
      hslLayers,
      exposureStrength,  // 新增
      exposureManual,   // 新增
      dehazeParams,  // 新增
      clarityParams,  // 新增
      luminanceParams  // 新增
    }

    // 步骤 1: 加载和缩放图像
    const imageLoadStep = new ImageLoadStep()
    let pipelineData = await imageLoadStep.loadAndScale(originalImage, maxResolution)

    // 步骤 2: LUT 处理
    const lutProcessStep = new LUTProcessStep()
    pipelineData = await lutProcessStep.execute(pipelineData, options)
    // 步骤 2.5: HSL调整
    if (options.hslLayers && options.hslLayers.length > 0) {
      const device = await getGPUDevice()
      const hslAdjustStep = new HSLAdjustProcessStep()
      pipelineData = await hslAdjustStep.execute(pipelineData, options.hslLayers, device)
    }

    // 步骤 2.6: 曝光调整（新增）
    // 只有当曝光参数不为默认值(1.0)时才应用曝光调整
    const hasExposureAdjustment = (options.exposureStrength && options.exposureStrength !== 1.0) ||
      (options.exposureManual && (options.exposureManual.exposure !== 1.0 || options.exposureManual.contrast !== 1.0 || options.exposureManual.gamma !== 1.0))

    if (hasExposureAdjustment) {
      const device = await getGPUDevice()
      const imageData = await gpuBufferToImageData(pipelineData.buffer, pipelineData.width, pipelineData.height, device)

      let processedImageData: ImageData
      if (options.exposureStrength && options.exposureStrength !== 1.0) {
        // 自动曝光调整
        processedImageData = await adjustExposure(imageData, options.exposureStrength)
      } else if (options.exposureManual) {
        // 手动曝光调整
        processedImageData = adjustExposureManual(
          imageData,
          options.exposureManual.exposure,
          options.exposureManual.contrast,
          options.exposureManual.gamma
        )
      } else {
        processedImageData = imageData
      }

      // 转换回 GPUBuffer
      const processedBuffer = await imageDataToGPUBuffer(processedImageData, device)

      // 销毁旧的 buffer
      pipelineData.buffer.destroy()

      pipelineData = {
        buffer: processedBuffer,
        width: processedImageData.width,
        height: processedImageData.height
      }
    }

    // 步骤 2.7: 去雾调整（新增）
    // 只有当去雾参数与默认值不同时才应用去雾
    const isDehazeNotDefault = options.dehazeParams && JSON.stringify(options.dehazeParams) !== JSON.stringify(DEFAULT_DEHAZE_PARAMS)

    if (isDehazeNotDefault) {
      const device = await getGPUDevice()
      const imageData = await gpuBufferToImageData(pipelineData.buffer, pipelineData.width, pipelineData.height, device)

      try {
        // 应用去雾调整
        const processedImageData = await applyDehazeAdjustment(imageData, options.dehazeParams!)

        // 转换回 GPUBuffer
        const processedBuffer = await imageDataToGPUBuffer(processedImageData, device)

        // 销毁旧的 buffer
        pipelineData.buffer.destroy()

        pipelineData = {
          buffer: processedBuffer,
          width: processedImageData.width,
          height: processedImageData.height
        }
      } catch (error) {
        console.warn('去雾处理失败，继续使用原始图像:', error)
      }
    }

    // 步骤 2.8: 清晰度调整（新增）
    // 只有当清晰度参数不为默认值时才应用清晰度调整
    // enhancementStrength和macroEnhancement为关键参数
    const hasClarityAdjustment = options.clarityParams &&
      (options.clarityParams.enhancementStrength !== 1.0 || options.clarityParams.macroEnhancement !== 0.0)

    if (hasClarityAdjustment) {
      const device = await getGPUDevice()
      const imageData = await gpuBufferToImageData(pipelineData.buffer, pipelineData.width, pipelineData.height, device)

      try {
        // 应用清晰度调整
        const processedImageData = await processClarityAdjustment(device, imageData, options.clarityParams!)

        // 转换回 GPUBuffer
        const processedBuffer = await imageDataToGPUBuffer(processedImageData, device)

        // 销毁旧的 buffer
        pipelineData.buffer.destroy()

        pipelineData = {
          buffer: processedBuffer,
          width: processedImageData.width,
          height: processedImageData.height
        }
      } catch (error) {
        console.warn('清晰度处理失败，继续使用原始图像:', error)
      }
    }

    // 步骤 2.9: 亮度调整（新增）
    // 只有当亮度参数不全为0时才应用亮度调整
    const hasLuminanceAdjustment = options.luminanceParams && (
      options.luminanceParams.shadows.brightness !== 0 || options.luminanceParams.shadows.contrast !== 0 ||
      options.luminanceParams.shadows.saturation !== 0 || options.luminanceParams.midtones.brightness !== 0 ||
      options.luminanceParams.midtones.contrast !== 0 || options.luminanceParams.midtones.saturation !== 0 ||
      options.luminanceParams.highlights.brightness !== 0 || options.luminanceParams.highlights.contrast !== 0 ||
      options.luminanceParams.highlights.saturation !== 0
    )

    if (hasLuminanceAdjustment) {
      const device = await getGPUDevice()
      const imageData = await gpuBufferToImageData(pipelineData.buffer, pipelineData.width, pipelineData.height, device)

      try {
        // 应用亮度调整
        const processedImageData = await applyLuminanceAdjustmentToImageData(device, imageData, options.luminanceParams!)

        // 转换回 GPUBuffer
        const processedBuffer = await imageDataToGPUBuffer(processedImageData, device)

        // 销毁旧的 buffer
        pipelineData.buffer.destroy()

        pipelineData = {
          buffer: processedBuffer,
          width: processedImageData.width,
          height: processedImageData.height
        }
      } catch (error) {
        console.warn('亮度调整处理失败，继续使用原始图像:', error)
      }
    }

    // 步骤 3: 可平铺化处理
    const tileableProcessStep = new TileableProcessStep()
    pipelineData = await tileableProcessStep.execute(pipelineData, options)

    // 步骤 4: 输出转换
    const outputConversionStep = new OutputConversionStep()
    const result = await outputConversionStep.convertToDataURL(pipelineData)

    // 清理 GPU 资源
    pipelineData.buffer.destroy()

    return result
  } catch (error) {
    const errorMessage = `处理图像时出错: ${error instanceof Error ? error.message : '未知错误'}`
    onError?.(errorMessage)
    throw error
  } finally {
    onProcessingEnd?.()
  }
}
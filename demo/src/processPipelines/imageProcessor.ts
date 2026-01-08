import { loadAndScaleImage } from './imageLoad.utils'
import { executeLUTProcess } from '../adjustments/lut'
import { executeTileableProcess } from './tileable.utils'
import { convertToDataURL } from './output.utils'
import { allMiddlewares, type MiddlewareContext } from './nodes/index'
/**
 * 获取或初始化 WebGPU 设备
 * 统一使用 webgpuDevice.ts 中的设备获取逻辑
 */
import {
  getWebGPUDevice,
  executeHSLAdjust
} from './imports'
import type {
  PipelineData
} from './imports'
import type {
  ProcessImageToTileableParams
} from './imageProcessor.types'
import { imageDataToGPUBuffer } from './imageProcessor.utils'
import { ERROR_MESSAGES } from './imageProcessor.constants'
import { TEMPLATES } from './imageProcessor.templates'

// 重新导出工具函数以保持向后兼容
export { imageDataToGPUBuffer }

/**
 * 处理图像管线内部逻辑
 */
async function processImagePipeline(params: ProcessImageToTileableParams): Promise<PipelineData> {
  const { originalImage, ...options } = params
  // 步骤 1: 加载和缩放图像
  let pipelineData = await loadAndScaleImage(originalImage, options.maxResolution ?? 2048)

  // 步骤 2: LUT 处理
  pipelineData = await executeLUTProcess(pipelineData, options)
  // 步骤 2.5: HSL调整
  if (options.hslLayers && options.hslLayers.length > 0) {
    const device = await getWebGPUDevice()
    pipelineData = await executeHSLAdjust(pipelineData, options.hslLayers, device)
  }

  // 步骤 2.6-2.9: 应用中间件处理（不含水印）
  const cache = new WeakMap()
  const context: MiddlewareContext = {
    options,
    pipelineData,
    cache,
    getWebGPUDevice: () => getWebGPUDevice()
  }

  // 按顺序应用所有中间件（水印节点会自动跳过，因为它在这里不应该执行）
  for (const middleware of allMiddlewares) {
    // 跳过水印节点，它将在 tileable 之后单独执行
    if ('isWatermark' in middleware) continue
    if (middleware.guard(options)) {
      await middleware.process(context)
      pipelineData = context.pipelineData
    }
  }

  // 步骤 3: 可平铺化处理
  pipelineData = await executeTileableProcess(pipelineData, options)

  // 步骤 4: 水印处理（在 tileable 之后）
  if (options.enableWatermark && options.watermarkConfig) {
    context.pipelineData = pipelineData
    const watermarkNode = allMiddlewares.find(m => 'isWatermark' in m)
    if (watermarkNode && watermarkNode.guard(options)) {
      await watermarkNode.process(context)
      pipelineData = context.pipelineData
    }
  }

  return pipelineData
}

/**
 * 处理图像，使其可平铺
 * @param params 处理参数
 * @returns 处理后的图像URL
 */
export async function processImageToTileable(
  params: ProcessImageToTileableParams
): Promise<string> {
  const { originalImage, onProcessingStart, onProcessingEnd, onError } = params

  if (!originalImage) {
    throw new Error(ERROR_MESSAGES.EMPTY_ORIGINAL_IMAGE)
  }

  onProcessingStart?.()

  try {
    const pipelineData = await processImagePipeline(params)
    const result = await convertToDataURL(pipelineData)
    pipelineData.buffer.destroy()
    return result
  } catch (error) {
    const errorDetail = error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR
    const errorMessage = TEMPLATES.processingError(errorDetail)
    onError?.(errorMessage)
    throw error
  } finally {
    onProcessingEnd?.()
  }
}

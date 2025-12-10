import { loadAndScaleImage } from './imageLoad.utils'
import { executeLUTProcess } from './lut.utils'
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
  DehazeParams,
  ClarityParams,
  LuminanceAdjustmentParams,
  HSLAdjustmentLayer
} from './imports'
import type {
  PipelineOptions
} from './imageProcessor.types'
import { imageDataToGPUBuffer } from './imageProcessor.utils'

// 重新导出工具函数以保持向后兼容
export { imageDataToGPUBuffer }


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
    let pipelineData = await loadAndScaleImage(originalImage, maxResolution)

    // 步骤 2: LUT 处理
    pipelineData = await executeLUTProcess(pipelineData, options)
    // 步骤 2.5: HSL调整
    if (options.hslLayers && options.hslLayers.length > 0) {
      const device = await getWebGPUDevice()
      pipelineData = await executeHSLAdjust(pipelineData, options.hslLayers, device)
    }

    // 步骤 2.6-2.9: 应用中间件处理
    const cache = new WeakMap()
    const context: MiddlewareContext = {
      options,
      pipelineData,
      cache,
      getWebGPUDevice: () => getWebGPUDevice()
    }

    // 按顺序应用所有中间件
    for (const middleware of allMiddlewares) {
      if (middleware.guard(options)) {
        await middleware.process(context)
        // 更新 pipelineData 为处理后的结果
        pipelineData = context.pipelineData
      }
    }

    // 步骤 3: 可平铺化处理
    pipelineData = await executeTileableProcess(pipelineData, options)

    // 步骤 4: 输出转换
    const result = await convertToDataURL(pipelineData)

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

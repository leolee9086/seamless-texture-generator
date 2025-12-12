/**
 * processPipelines 目录的统一导入转发文件
 * 用于转发来自父级目录的类型，避免直接使用 ../ 导入
 */

// 类型导入转发 - 仅来自父级目录或别名
import type {
  DehazeParams,
  ClarityParams,
  LuminanceAdjustmentParams,
  baseOptions,
  GeneralSynthesisPipelineStep,
  PipelineData
} from '../utils/imports'

// HSL 相关类型和函数转发
import type { HSLAdjustmentLayer } from '../adjustments/hsl/hslAdjust.utils'
import { executeHSLAdjust } from '../adjustments/hsl/hslAdjust.utils'

// 值导入转发 - 仅来自父级目录的工具函数
import { scaleImageToMaxResolution } from '../utils/imageLoader'
import { getWebGPUDevice } from '../utils/webgpu/deviceCache/webgpuDevice'
import { gpuBufferToImageData } from '@/utils/webgpu/convert/gpuBufferToImageData'
import { processLutData, processImageWithLUT } from '@leolee9086/use-lut'
import { makeTileable } from '../../../src/lib/HistogramPreservingBlendMakeTileable'

export type {
  DehazeParams,
  ClarityParams,
  LuminanceAdjustmentParams,
  baseOptions,
  GeneralSynthesisPipelineStep,
  PipelineData,
  HSLAdjustmentLayer
}

export {
  executeHSLAdjust,
  scaleImageToMaxResolution,
  getWebGPUDevice,
  gpuBufferToImageData,
  processLutData,
  processImageWithLUT,
  makeTileable
}

import type {
  HSLAdjustmentLayer,
  DehazeParams,
  ClarityParams,
  LuminanceAdjustmentParams,
  baseOptions,
  GeneralSynthesisPipelineStep,
  PipelineData
} from './imports'

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
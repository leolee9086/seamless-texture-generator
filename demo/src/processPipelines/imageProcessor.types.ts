import type {
  HSLAdjustmentLayer,
  DehazeParams,
  ClarityParams,
  LuminanceAdjustmentParams,
  baseOptions,
  GeneralSynthesisPipelineStep,
  PipelineData,
  水印配置
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
  exposureStrength?: number
  exposureManual?: { exposure: number; contrast: number; gamma: number }
  dehazeParams?: DehazeParams
  clarityParams?: ClarityParams
  luminanceParams?: LuminanceAdjustmentParams
  /** 水印配置 */
  watermarkConfig?: 水印配置
  /** 是否启用水印 */
  enableWatermark?: boolean
}

/**
 * 图片后处理管线步骤接口
 */
export interface ImageProcessPipelineStep extends GeneralSynthesisPipelineStep {
  execute(data: PipelineData, options: PipelineOptions): Promise<PipelineData>
}

/**
 * LUT 掩码选项
 */
export interface LutMaskOptions {
  intensity: number
  maskData?: {
    data: Uint8Array
    width: number
    height: number
  }
  maskIntensity?: number
  enableMask?: boolean
}

/**
 * 应用 LUT 的参数对象
 */
export interface ApplyLUTParams {
  imageData: ImageData
  lutData: Uint8Array
  maskOptions: LutMaskOptions
  device: GPUDevice
}

/**
 * processImageToTileable 函数的参数对象
 */
export interface ProcessImageToTileableParams extends PipelineOptions {
  originalImage: string
  onProcessingStart?: () => void
  onProcessingEnd?: () => void
  onError?: (message: string) => void
}
/**
 * 图像去雾调整工具
 * 基于WebGPU的高性能去雾算法实现
 * @author 织
 */

import { dehazeImageWebGPUSimple, preInitializeDevice, clearAllCaches } from '@leolee9086/image-dehazing'

/**
 * 去雾调整参数接口
 */
export interface DehazeParams {
  /** 去雾强度 (0.1-0.99) */
  omega: number
  /** 最小透射率阈值 (0.01-0.3) */
  t0: number
  /** 暗通道窗口大小 (3-31) */
  windowSize: number
  /** 大气光估计比例 (0.01-0.5) */
  topRatio: number
  /** 是否启用自适应模式 */
  adaptiveMode: boolean
  /** 是否启用空间自适应模式 */
  spatialAdaptiveMode: boolean
  /** 自适应调整强度 (0.1-2.0) */
  adaptiveStrength: number
  /** 雾强度权重 (0.0-1.0) */
  hazeWeight: number
  /** 大气光权重 (0.0-1.0) */
  atmosphericWeight: number
  /** 是否启用增强功能 */
  enableEnhancement: boolean
  /** 饱和度增强因子 (0.0-2.0) */
  saturationEnhancement: number
  /** 对比度增强因子 (0.5-2.0) */
  contrastEnhancement: number
  /** 明度增强因子 (0.5-2.0) */
  brightnessEnhancement: number
}

/**
 * 默认去雾参数
 */
export const DEFAULT_DEHAZE_PARAMS: DehazeParams = {
  omega: 0.95,
  t0: 0.1,
  windowSize: 15,
  topRatio: 0.1,
  adaptiveMode: false,
  spatialAdaptiveMode: false,
  adaptiveStrength: 1.0,
  hazeWeight: 0.5,
  atmosphericWeight: 0.3,
  enableEnhancement: false,
  saturationEnhancement: 1.2,
  contrastEnhancement: 1.1,
  brightnessEnhancement: 1.0
}

/**
 * 应用去雾调整
 * @param imageData 输入图像数据
 * @param params 去雾参数
 * @returns 处理后的图像数据
 */
export async function applyDehazeAdjustment(
  imageData: ImageData,
  params: DehazeParams
): Promise<ImageData> {
  try {
    // 确保WebGPU设备已初始化
    await preInitializeDevice()
    
    // 构建算法选项
    const options = {
      windowSize: params.windowSize,
      topRatio: params.topRatio,
      omega: params.omega,
      t0: params.t0,
      adaptiveMode: params.adaptiveMode,
      spatialAdaptiveMode: params.spatialAdaptiveMode,
      adaptiveStrength: params.adaptiveStrength,
      adaptiveOptions: {
        hazeWeight: params.hazeWeight,
        atmosphericWeight: params.atmosphericWeight
      },
      enhancementOptions: {
        enableEnhancement: params.enableEnhancement,
        saturationEnhancement: params.saturationEnhancement,
        contrastEnhancement: params.contrastEnhancement,
        brightnessEnhancement: params.brightnessEnhancement
      }
    }
    
    // 执行去雾处理
    const result = await dehazeImageWebGPUSimple(imageData, options)
    
    // 转换为标准ImageData格式
    const outputImageData = new ImageData(
      result.imageData.data,
      result.imageData.width,
      result.imageData.height
    )
    
    return outputImageData
  } catch (error) {
    console.error('去雾处理失败:', error)
    throw new Error(`去雾处理失败: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * 预设去雾配置
 */
export const DEHAZE_PRESETS = {
  /** 轻度去雾 */
  light: {
    omega: 0.8,
    t0: 0.15,
    windowSize: 15,
    topRatio: 0.1,
    adaptiveMode: false,
    spatialAdaptiveMode: false,
    adaptiveStrength: 1.0,
    hazeWeight: 0.5,
    atmosphericWeight: 0.3,
    enableEnhancement: false,
    saturationEnhancement: 1.1,
    contrastEnhancement: 1.05,
    brightnessEnhancement: 1.0
  },
  /** 中度去雾 */
  medium: {
    omega: 0.9,
    t0: 0.1,
    windowSize: 15,
    topRatio: 0.1,
    adaptiveMode: false,
    spatialAdaptiveMode: false,
    adaptiveStrength: 1.0,
    hazeWeight: 0.5,
    atmosphericWeight: 0.3,
    enableEnhancement: false,
    saturationEnhancement: 1.2,
    contrastEnhancement: 1.1,
    brightnessEnhancement: 1.0
  },
  /** 重度去雾 */
  heavy: {
    omega: 0.95,
    t0: 0.05,
    windowSize: 21,
    topRatio: 0.05,
    adaptiveMode: false,
    spatialAdaptiveMode: false,
    adaptiveStrength: 1.0,
    hazeWeight: 0.5,
    atmosphericWeight: 0.3,
    enableEnhancement: false,
    saturationEnhancement: 1.3,
    contrastEnhancement: 1.15,
    brightnessEnhancement: 1.05
  },
  /** 自适应去雾 */
  adaptive: {
    omega: 0.95,
    t0: 0.1,
    windowSize: 15,
    topRatio: 0.1,
    adaptiveMode: true,
    spatialAdaptiveMode: false,
    adaptiveStrength: 1.2,
    hazeWeight: 0.6,
    atmosphericWeight: 0.3,
    enableEnhancement: false,
    saturationEnhancement: 1.2,
    contrastEnhancement: 1.1,
    brightnessEnhancement: 1.0
  },
  /** 空间自适应去雾 */
  spatialAdaptive: {
    omega: 0.95,
    t0: 0.1,
    windowSize: 15,
    topRatio: 0.1,
    adaptiveMode: true,
    spatialAdaptiveMode: true,
    adaptiveStrength: 1.3,
    hazeWeight: 0.7,
    atmosphericWeight: 0.2,
    enableEnhancement: false,
    saturationEnhancement: 1.2,
    contrastEnhancement: 1.1,
    brightnessEnhancement: 1.0
  },
  /** 增强去雾 */
  enhanced: {
    omega: 0.9,
    t0: 0.1,
    windowSize: 15,
    topRatio: 0.1,
    adaptiveMode: false,
    spatialAdaptiveMode: false,
    adaptiveStrength: 1.0,
    hazeWeight: 0.5,
    atmosphericWeight: 0.3,
    enableEnhancement: true,
    saturationEnhancement: 1.4,
    contrastEnhancement: 1.2,
    brightnessEnhancement: 1.1
  }
} as const

/**
 * 去雾预设类型
 */
export type DehazePreset = keyof typeof DEHAZE_PRESETS

/**
 * 获取去雾预设
 * @param preset 预设名称
 * @returns 预设参数
 */
export function getDehazePreset(preset: DehazePreset): DehazeParams {
  return { ...DEHAZE_PRESETS[preset] }
}

/**
 * 清理去雾缓存
 * 用于内存管理和性能优化
 */
export function clearDehazeCache(): void {
  try {
    clearAllCaches()
    console.log('去雾缓存已清理')
  } catch (error) {
    console.warn('清理去雾缓存失败:', error)
  }
}

/**
 * 验证去雾参数
 * @param params 去雾参数
 * @returns 验证结果
 */
export function validateDehazeParams(params: Partial<DehazeParams>): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (params.omega !== undefined) {
    if (params.omega < 0.1 || params.omega > 0.99) {
      errors.push('去雾强度(omega)必须在0.1-0.99之间')
    }
  }
  
  if (params.t0 !== undefined) {
    if (params.t0 < 0.01 || params.t0 > 0.3) {
      errors.push('最小透射率阈值(t0)必须在0.01-0.3之间')
    }
  }
  
  if (params.windowSize !== undefined) {
    if (params.windowSize < 0 || params.windowSize > 31 || params.windowSize % 2 === 0) {
      errors.push('暗通道窗口大小必须是3-31之间的奇数')
    }
  }
  
  if (params.topRatio !== undefined) {
    if (params.topRatio < 0.01 || params.topRatio > 0.5) {
      errors.push('大气光估计比例必须在0.01-0.5之间')
    }
  }
  
  if (params.adaptiveStrength !== undefined) {
    if (params.adaptiveStrength < 0.1 || params.adaptiveStrength > 2.0) {
      errors.push('自适应调整强度必须在0.1-2.0之间')
    }
  }
  
  if (params.hazeWeight !== undefined) {
    if (params.hazeWeight < 0.0 || params.hazeWeight > 1.0) {
      errors.push('雾强度权重必须在0.0-1.0之间')
    }
  }
  
  if (params.atmosphericWeight !== undefined) {
    if (params.atmosphericWeight < 0.0 || params.atmosphericWeight > 1.0) {
      errors.push('大气光权重必须在0.0-1.0之间')
    }
  }
  
  if (params.saturationEnhancement !== undefined) {
    if (params.saturationEnhancement < 0.0 || params.saturationEnhancement > 2.0) {
      errors.push('饱和度增强因子必须在0.0-2.0之间')
    }
  }
  
  if (params.contrastEnhancement !== undefined) {
    if (params.contrastEnhancement < 0.5 || params.contrastEnhancement > 2.0) {
      errors.push('对比度增强因子必须在0.5-2.0之间')
    }
  }
  
  if (params.brightnessEnhancement !== undefined) {
    if (params.brightnessEnhancement < 0.5 || params.brightnessEnhancement > 2.0) {
      errors.push('明度增强因子必须在0.5-2.0之间')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
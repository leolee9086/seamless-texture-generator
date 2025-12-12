/**
 * 图像去雾调整工具
 * 基于WebGPU的高性能去雾算法实现
 * @author 织
 */

import { dehazeImageWebGPUSimple, preInitializeDevice, clearAllCaches } from './imports'
import { DehazeParams, DehazePreset } from './types'
import { DEHAZE_PRESETS } from './DEHAZE_PRESETS'
import { dehazeFailed } from './templates'

/**
 * 默认去雾参数
 */
export const DEFAULT_DEHAZE_PARAMS: DehazeParams = DEHAZE_PRESETS.default

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
    // 需要创建一个新的Uint8ClampedArray，确保底层的ArrayBuffer类型正确
    const dataArray = new Uint8ClampedArray(result.imageData.data)
    const outputImageData = new ImageData(
      dataArray,
      result.imageData.width,
      result.imageData.height
    )
    
    return outputImageData
  } catch (error) {
    console.error('去雾处理失败:', error)
    throw new Error(dehazeFailed(error))
  }
}


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
  } catch (error) {
    console.warn('清理去雾缓存失败:', error)
  }
}

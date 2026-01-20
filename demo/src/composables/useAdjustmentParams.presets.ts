/**
 * 调整参数预设
 *
 * 从 useAdjustmentParams.ts 导出的默认参数值
 */

import type { DehazeParams, ClarityParams, LuminanceAdjustmentParams } from './imports'

/** 去雾参数默认值 */
export const 默认去雾参数: DehazeParams = {
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

/** 清晰度参数默认值 */
export const 默认清晰度参数: ClarityParams = {
    sigma: 8.0,
    epsilon: 0.04,
    radius: 8,
    blockSize: 16,
    detailStrength: 2.0,
    enhancementStrength: 1.0,
    macroEnhancement: 0.0,
    contrastBoost: 1.2
}

/** 亮度参数默认值 */
export const 默认亮度参数: LuminanceAdjustmentParams = {
    shadows: { brightness: 0, contrast: 0, saturation: 0, red: 0, green: 0, blue: 0 },
    midtones: { brightness: 0, contrast: 0, saturation: 0, red: 0, green: 0, blue: 0 },
    highlights: { brightness: 0, contrast: 0, saturation: 0, red: 0, green: 0, blue: 0 },
    shadowEnd: 0.33,
    highlightStart: 0.66,
    softness: 0.1
}

/**
 * 预设去雾配置
 */
import { DehazeParams } from "./types";
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
  },
  default: {
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
} as const ;

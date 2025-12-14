/**
 * 亮度调整模块出口
 * 
 * 该模块提供图像亮度调整相关的功能，包括：
 * - 阴影/中间调/高光分区调整
 * - 色彩通道调整
 * - 预设管理
 */

// 类型导入和导出
import type { LuminanceAdjustmentParams, ZoneAdjustment } from './imports'
import type { LuminancePreset, LuminancePresetItem, LuminancePresets } from './luminanceAdjustment.types'

export type { LuminanceAdjustmentParams, ZoneAdjustment }
export type { LuminancePreset, LuminancePresetItem, LuminancePresets }

// 预设和工具函数
import { DEFAULT_LUMINANCE_PARAMS, LUMINANCE_PRESETS, getLuminancePreset } from './luminanceAdjustment.presets'
import { validateLuminanceParams, createLuminanceAdjustmentEvent } from './luminanceAdjustment'
import { applyLuminanceAdjustmentToImageData } from './luminanceAdjustment.gpu.utils'

export { DEFAULT_LUMINANCE_PARAMS, LUMINANCE_PRESETS, getLuminancePreset }
export { validateLuminanceParams, createLuminanceAdjustmentEvent }
export { applyLuminanceAdjustmentToImageData }

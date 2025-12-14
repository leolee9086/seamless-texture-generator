/**
 * 清晰度调整模块出口
 * 
 * 该模块提供图像清晰度调整相关的功能，包括：
 * - GPU加速的清晰度增强
 * - 基于Guided Filter的细节分离与增强
 * - 预设参数配置
 */

// 类型导入与导出
import type {
    ClarityParams,
    ClarityPresetConfig,
    ClarityPresetsCollection,
    GPUCompositionContext,
    GPUTextureReadContext
} from './clarityAdjustment.types'
export type {
    ClarityParams,
    ClarityPresetConfig,
    ClarityPresetsCollection,
    GPUCompositionContext,
    GPUTextureReadContext
}

// 预设和常量导入与导出
import { DEFAULT_CLARITY_PARAMS, CLARITY_PRESETS, 默认清晰度参数, 清晰度预设 } from './clarityAdjustment.presets'
export { DEFAULT_CLARITY_PARAMS, CLARITY_PRESETS, 默认清晰度参数, 清晰度预设 }

// 常量导入与导出
import { GPU资源标签, GPU_RESOURCE_LABELS } from './clarityAdjustment.constants'
export { GPU资源标签, GPU_RESOURCE_LABELS }

// 着色器代码导入与导出
import { 清晰度合成着色器, CLARITY_COMPOSITION_SHADER } from './clarityAdjustment.code'
export { 清晰度合成着色器, CLARITY_COMPOSITION_SHADER }

// 类型守卫导入与导出
import { isClarityParams, validateClarityParams } from './clarityAdjustment.guard'
export { isClarityParams, validateClarityParams }

// 函数导入与导出
import {
    processClarityAdjustment,
    createClarityAdjustmentEvent,
    getClarityPreset
} from './clarityAdjustment'
export {
    processClarityAdjustment,
    createClarityAdjustmentEvent,
    getClarityPreset
}

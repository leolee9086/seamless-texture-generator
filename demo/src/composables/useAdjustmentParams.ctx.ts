import { ref, watch } from './imports'
import type { DehazeParams, ClarityParams, LuminanceAdjustmentParams } from './imports'
import { useProjectState } from './useProjectState'
import type { HSLAdjustmentLayer, AdjustmentParams, 同步上下文 } from './useAdjustmentParams.types'
import { 曝光模式_CDF, 刷新时机_同步 } from './useAdjustmentParams.constants'
//@AIDONE 参数默认参数应该由各个模块的presets导出
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

/**
 * 调整参数状态管理（曝光、去雾、清晰度、亮度）
 */
export function 使用调整参数(): AdjustmentParams {
    // === 状态定义 ===
    const 状态 = {
        globalHSL: ref({ hue: 0, saturation: 0, lightness: 0 }),
        hslLayers: ref<HSLAdjustmentLayer[]>([]),
        exposureStrength: ref(1.0),
        exposureManual: ref({ exposure: 1.0, contrast: 1.0, gamma: 1.0 }),
        exposureMode: ref<'cdf' | 'clahe'>(曝光模式_CDF),
        claheConfig: ref({ clipLimit: 2.0, blockSize: 64, numBins: 256, strength: 1.0 }),
        dehazeParams: ref<DehazeParams>({ ...默认去雾参数 }),
        clarityParams: ref<ClarityParams>({ ...默认清晰度参数 }),
        luminanceParams: ref<LuminanceAdjustmentParams>({ ...默认亮度参数 })
    }

    const { state: projectState, actions: projectActions } = useProjectState()

    // 状态控制
    const 同步锁 = { 正在同步中: false }

    // 注册同步逻辑
    设置同步逻辑({ 状态, 项目状态: projectState, 项目动作: projectActions, 同步锁 })

    return 状态
}

/**
 * 内部函数：设置双向同步逻辑
 */
function 设置同步逻辑(上下文: 同步上下文): void {
    const { 状态, 项目状态, 项目动作, 同步锁 } = 上下文

    // 1. 同步项目到本地
    watch(() => 项目状态.activeProject.value?.params, (新参数) => {
        if (!新参数 || 同步锁.正在同步中) return
        同步锁.正在同步中 = true
        try {
            if (新参数.globalHSL) 状态.globalHSL.value = { ...新参数.globalHSL }
            if (新参数.hslLayers) 状态.hslLayers.value = [...新参数.hslLayers]
            if (新参数.exposureStrength !== undefined) 状态.exposureStrength.value = 新参数.exposureStrength
            if (新参数.exposureManual) 状态.exposureManual.value = { ...新参数.exposureManual }
            if (新参数.exposureMode) 状态.exposureMode.value = 新参数.exposureMode
            if (新参数.claheConfig) 状态.claheConfig.value = { ...新参数.claheConfig }
            if (新参数.dehazeParams) 状态.dehazeParams.value = { ...新参数.dehazeParams }
            if (新参数.clarityParams) 状态.clarityParams.value = { ...新参数.clarityParams }
            if (新参数.luminanceParams) 状态.luminanceParams.value = { ...新参数.luminanceParams }
        } finally {
            同步锁.正在同步中 = false
        }
    }, { deep: true, immediate: true })

    // 2. 同步本地到项目
    watch(
        [
            状态.globalHSL, 状态.hslLayers, 状态.exposureStrength, 状态.exposureManual,
            状态.exposureMode, 状态.claheConfig, 状态.dehazeParams, 状态.clarityParams, 状态.luminanceParams
        ],
        () => {
            if (!项目状态.activeProject.value || 同步锁.正在同步中) return
            同步锁.正在同步中 = true
            try {
                项目动作.updateProjectParams({
                    globalHSL: { ...状态.globalHSL.value },
                    hslLayers: [...状态.hslLayers.value],
                    exposureStrength: 状态.exposureStrength.value,
                    exposureManual: { ...状态.exposureManual.value },
                    exposureMode: 状态.exposureMode.value,
                    claheConfig: { ...状态.claheConfig.value },
                    dehazeParams: { ...状态.dehazeParams.value },
                    clarityParams: { ...状态.clarityParams.value },
                    luminanceParams: { ...状态.luminanceParams.value }
                })
            } finally {
                同步锁.正在同步中 = false
            }
        },
        { deep: true, flush: 刷新时机_同步 }
    )
}

/** 兼容性别名导出 */
export const useAdjustmentParams = 使用调整参数

/** 使用调整参数 返回值类型 */
export type { AdjustmentParams }

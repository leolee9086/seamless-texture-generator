import { ref } from './imports'
import type { DehazeParams, ClarityParams, LuminanceAdjustmentParams } from './imports'
import { watch } from 'vue'
import { useProjectState } from './useProjectState'
import type { HSLAdjustmentLayer, AdjustmentParams } from './useAdjustmentParams.types'
//@AITODO 参数默认参数应该由各个模块的presets导出
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
export function useAdjustmentParams(): AdjustmentParams {
    // HSL 调整
    const globalHSL = ref({ hue: 0, saturation: 0, lightness: 0 })
    const hslLayers = ref<HSLAdjustmentLayer[]>([])

    // 曝光调整
    const exposureStrength = ref(1.0)
    const exposureManual = ref({ exposure: 1.0, contrast: 1.0, gamma: 1.0 })

    // 去雾调整
    const dehazeParams = ref<DehazeParams>({ ...默认去雾参数 })

    // 清晰度调整
    const clarityParams = ref<ClarityParams>({ ...默认清晰度参数 })

    // 引入项目状态
    const { state: projectState, actions: projectActions } = useProjectState()

    // 亮度调整
    const luminanceParams = ref<LuminanceAdjustmentParams>({ ...默认亮度参数 })

    // === 参数同步逻辑 ===

    // 标志位：防止循环同步 (project -> local -> project)
    let isSyncing = false

    // 1. 从项目同步到本地 (Project -> Local)
    watch(() => projectState.activeProject.value?.params, (newParams) => {
        if (!newParams || isSyncing) return

        isSyncing = true
        try {
            if (newParams.globalHSL) globalHSL.value = { ...newParams.globalHSL }
            if (newParams.hslLayers) hslLayers.value = [...newParams.hslLayers]
            if (newParams.exposureStrength !== undefined) exposureStrength.value = newParams.exposureStrength
            if (newParams.exposureManual) exposureManual.value = { ...newParams.exposureManual }
            if (newParams.dehazeParams) dehazeParams.value = { ...newParams.dehazeParams }
            if (newParams.clarityParams) clarityParams.value = { ...newParams.clarityParams }
            if (newParams.luminanceParams) luminanceParams.value = { ...newParams.luminanceParams }
        } finally {
            isSyncing = false
        }
    }, { deep: true, immediate: true })

    // 2. 从本地同步到项目 (Local -> Project)
    watch(
        [globalHSL, hslLayers, exposureStrength, exposureManual, dehazeParams, clarityParams, luminanceParams],
        () => {
            // 如果没有活动项目，或者正在从项目同步，则跳过
            if (!projectState.activeProject.value || isSyncing) return

            isSyncing = true
            try {
                // 构建更新对象
                // 注意：这里更新 activeProject.value.params 会触发上面的 watch
                // 但由于 isSyncing 为 true，上面的 watch 会提前返回
                projectActions.updateProjectParams({
                    globalHSL: { ...globalHSL.value },
                    hslLayers: [...hslLayers.value],
                    exposureStrength: exposureStrength.value,
                    exposureManual: { ...exposureManual.value },
                    dehazeParams: { ...dehazeParams.value },
                    clarityParams: { ...clarityParams.value },
                    luminanceParams: { ...luminanceParams.value }
                })
            } finally {
                isSyncing = false
            }
        },
        { deep: true, flush: 'sync' }
    )

    return {
        globalHSL,
        hslLayers,
        exposureStrength,
        exposureManual,
        dehazeParams,
        clarityParams,
        luminanceParams,
    }
}

/** useAdjustmentParams 返回值类型 */
export type { AdjustmentParams }

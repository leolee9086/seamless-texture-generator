import { useProceduralTextureState, computed, defaultPlainWeaveAdvancedParams } from './imports'
import type { SliderItem, ComputedRef } from './imports'
import type { PlainWeaveAdvancedParams, SliderConfig } from './PlainWeaveAdvancedPanel.types'
import {
  SLIDER_IDS,
  SLIDER_LABELS,
  SLIDER_RANGES,
  SLIDER_STEPS,
  PANEL_TITLES,
  VALUE_POSITION,
  PLAIN_WEAVE_PANEL_KEYS
} from './PlainWeaveAdvancedPanel.constants'

/**
 * 创建单个滑块项
 */
const createSliderItem = (config: SliderConfig): SliderItem => ({
  id: config.id,
  label: config.label,
  value: config.value,
  min: config.min,
  max: config.max,
  step: config.step,
  valuePosition: VALUE_POSITION.AFTER,
  showRuler: false
})

/**
 * 基础编织参数滑块配置
 */
export const useBasicWeaveSliderItems = (): ComputedRef<SliderItem[]> => {
  const { state } = useProceduralTextureState()

  return computed(() => {
    // Ensure params exist (or default to something safe if still loading/undefined)
    const params = state.plainWeaveAdvancedParams || defaultPlainWeaveAdvancedParams

    const items: SliderItem[] = [
      createSliderItem({
        id: SLIDER_IDS.TILE_SIZE,
        label: SLIDER_LABELS.TILE_SIZE,
        value: params.tileSize,
        min: 0.1,
        max: 5.0,
        step: 0.1
      }),
      createSliderItem({
        id: SLIDER_IDS.WARP_DENSITY,
        label: SLIDER_LABELS.WARP_DENSITY,
        value: params.warpDensity,
        min: 5.0,
        max: 100.0,
        step: 1.0
      }),
      createSliderItem({
        id: SLIDER_IDS.WEFT_DENSITY,
        label: SLIDER_LABELS.WEFT_DENSITY,
        value: params.weftDensity,
        min: 5.0,
        max: 100.0,
        step: 1.0
      }),
      createSliderItem({
        id: SLIDER_IDS.THREAD_THICKNESS,
        label: SLIDER_LABELS.THREAD_THICKNESS,
        value: params.threadThickness,
        min: 0.1,
        max: 1.0,
        step: 0.05
      })
    ]
    return items
  })
}

/**
 * 创建线纤维特性滑块项
 */
function createThreadFiberSliders(params: PlainWeaveAdvancedParams): SliderItem[] {
  return [
    createSliderItem({
      id: SLIDER_IDS.THREAD_TWIST,
      label: SLIDER_LABELS.THREAD_TWIST,
      value: params.threadTwist,
      min: SLIDER_RANGES.THREAD_TWIST.MIN,
      max: SLIDER_RANGES.THREAD_TWIST.MAX,
      step: SLIDER_STEPS.DEFAULT
    }),
    createSliderItem({
      id: SLIDER_IDS.FIBER_DETAIL,
      label: SLIDER_LABELS.FIBER_DETAIL,
      value: params.fiberDetail,
      min: SLIDER_RANGES.FIBER_DETAIL.MIN,
      max: SLIDER_RANGES.FIBER_DETAIL.MAX,
      step: SLIDER_STEPS.DEFAULT
    }),
    createSliderItem({
      id: SLIDER_IDS.FUZZINESS,
      label: SLIDER_LABELS.FUZZINESS,
      value: params.fuzziness,
      min: SLIDER_RANGES.FUZZINESS.MIN,
      max: SLIDER_RANGES.FUZZINESS.MAX,
      step: SLIDER_STEPS.DEFAULT
    })
  ]
}

/**
 * 创建编织结构滑块项
 */
function createWeaveStructureSliders(params: PlainWeaveAdvancedParams): SliderItem[] {
  return [
    createSliderItem({
      id: SLIDER_IDS.WEAVE_TIGHTNESS,
      label: SLIDER_LABELS.WEAVE_TIGHTNESS,
      value: params.weaveTightness,
      min: SLIDER_RANGES.WEAVE_TIGHTNESS.MIN,
      max: SLIDER_RANGES.WEAVE_TIGHTNESS.MAX,
      step: SLIDER_STEPS.DEFAULT
    }),
    createSliderItem({
      id: SLIDER_IDS.THREAD_UNEVENNESS,
      label: SLIDER_LABELS.THREAD_UNEVENNESS,
      value: params.threadUnevenness,
      min: SLIDER_RANGES.THREAD_UNEVENNESS.MIN,
      max: SLIDER_RANGES.THREAD_UNEVENNESS.MAX,
      step: SLIDER_STEPS.DEFAULT
    }),
    createSliderItem({
      id: SLIDER_IDS.WEAVE_IMPERFECTION,
      label: SLIDER_LABELS.WEAVE_IMPERFECTION,
      value: params.weaveImperfection,
      min: SLIDER_RANGES.WEAVE_IMPERFECTION.MIN,
      max: SLIDER_RANGES.WEAVE_IMPERFECTION.MAX,
      step: SLIDER_STEPS.DEFAULT
    })
  ]
}

/**
 * 线结构参数滑块配置
 */
export const useThreadWeaveSliderItems = (): ComputedRef<SliderItem[]> => {
  const { state } = useProceduralTextureState()
  return computed(() => {
    const params = state.plainWeaveAdvancedParams || defaultPlainWeaveAdvancedParams
    return [
      ...createThreadFiberSliders(params),
      ...createWeaveStructureSliders(params)
    ]
  })
}

/**
 * 创建噪声和FBM滑块项
 */
function createNoiseAndFBMSliders(params: PlainWeaveAdvancedParams): SliderItem[] {
  return [
    createSliderItem({
      id: SLIDER_IDS.FBM_OCTAVES,
      label: SLIDER_LABELS.FBM_OCTAVES,
      value: params.fbmOctaves,
      min: SLIDER_RANGES.FBM_OCTAVES.MIN,
      max: SLIDER_RANGES.FBM_OCTAVES.MAX,
      step: SLIDER_STEPS.INTEGER
    }),
    createSliderItem({
      id: SLIDER_IDS.FBM_AMPLITUDE,
      label: SLIDER_LABELS.FBM_AMPLITUDE,
      value: params.fbmAmplitude,
      min: SLIDER_RANGES.FBM_AMPLITUDE.MIN,
      max: SLIDER_RANGES.FBM_AMPLITUDE.MAX,
      step: SLIDER_STEPS.DEFAULT
    }),
    createSliderItem({
      id: SLIDER_IDS.NOISE_FREQUENCY,
      label: SLIDER_LABELS.NOISE_FREQUENCY,
      value: params.noiseFrequency,
      min: SLIDER_RANGES.NOISE_FREQUENCY.MIN,
      max: SLIDER_RANGES.NOISE_FREQUENCY.MAX,
      step: 0.5
    })
  ]
}

/**
 * 创建视觉增强滑块项
 */
function createVisualEnhancementSliders(params: PlainWeaveAdvancedParams): SliderItem[] {
  return [
    createSliderItem({
      id: SLIDER_IDS.COLOR_VARIATION,
      label: SLIDER_LABELS.COLOR_VARIATION,
      value: params.colorVariation,
      min: SLIDER_RANGES.COLOR_VARIATION.MIN,
      max: SLIDER_RANGES.COLOR_VARIATION.MAX,
      step: SLIDER_STEPS.DEFAULT
    }),
    createSliderItem({
      id: SLIDER_IDS.THREAD_HEIGHT_SCALE,
      label: SLIDER_LABELS.THREAD_HEIGHT_SCALE,
      value: params.threadHeightScale,
      min: SLIDER_RANGES.THREAD_HEIGHT_SCALE.MIN,
      max: SLIDER_RANGES.THREAD_HEIGHT_SCALE.MAX,
      step: 0.1
    }),
    createSliderItem({
      id: SLIDER_IDS.THREAD_SHADOW_STRENGTH,
      label: SLIDER_LABELS.THREAD_SHADOW_STRENGTH,
      value: params.threadShadowStrength,
      min: SLIDER_RANGES.THREAD_SHADOW_STRENGTH.MIN,
      max: SLIDER_RANGES.THREAD_SHADOW_STRENGTH.MAX,
      step: SLIDER_STEPS.DEFAULT
    })
  ]
}

/**
 * 高级编织参数滑块配置
 */
export const useAdvancedWeaveSliderItems = (): ComputedRef<SliderItem[]> => {
  const { state } = useProceduralTextureState()
  return computed(() => {
    const params = state.plainWeaveAdvancedParams || defaultPlainWeaveAdvancedParams
    return [
      ...createNoiseAndFBMSliders(params),
      ...createVisualEnhancementSliders(params)
    ]
  })
}

/**
 * 创建光泽和法线滑块项
 */
function createSheenAndNormalSliders(params: PlainWeaveAdvancedParams): SliderItem[] {
  return [
    createSliderItem({
      id: SLIDER_IDS.WARP_SHEEN,
      label: SLIDER_LABELS.WARP_SHEEN,
      value: params.warpSheen,
      min: SLIDER_RANGES.WARP_SHEEN.MIN,
      max: SLIDER_RANGES.WARP_SHEEN.MAX,
      step: SLIDER_STEPS.DEFAULT
    }),
    createSliderItem({
      id: SLIDER_IDS.WEFT_SHEEN,
      label: SLIDER_LABELS.WEFT_SHEEN,
      value: params.weftSheen,
      min: SLIDER_RANGES.WEFT_SHEEN.MIN,
      max: SLIDER_RANGES.WEFT_SHEEN.MAX,
      step: SLIDER_STEPS.DEFAULT
    }),
    createSliderItem({
      id: SLIDER_IDS.NORMAL_STRENGTH,
      label: SLIDER_LABELS.NORMAL_STRENGTH,
      value: params.normalStrength,
      min: SLIDER_RANGES.NORMAL_STRENGTH.MIN,
      max: SLIDER_RANGES.NORMAL_STRENGTH.MAX,
      step: 0.5
    })
  ]
}

/**
 * 创建粗糙度滑块项
 */
function createRoughnessSliders(params: PlainWeaveAdvancedParams): SliderItem[] {
  return [
    createSliderItem({
      id: SLIDER_IDS.ROUGHNESS_MIN,
      label: SLIDER_LABELS.ROUGHNESS_MIN,
      value: params.roughnessMin,
      min: SLIDER_RANGES.ROUGHNESS_MIN.MIN,
      max: SLIDER_RANGES.ROUGHNESS_MIN.MAX,
      step: SLIDER_STEPS.DEFAULT
    }),
    createSliderItem({
      id: SLIDER_IDS.ROUGHNESS_MAX,
      label: SLIDER_LABELS.ROUGHNESS_MAX,
      value: params.roughnessMax,
      min: SLIDER_RANGES.ROUGHNESS_MAX.MIN,
      max: SLIDER_RANGES.ROUGHNESS_MAX.MAX,
      step: SLIDER_STEPS.DEFAULT
    })
  ]
}

/**
 * 材料编织参数滑块配置
 */
export const useMaterialWeaveSliderItems = (): ComputedRef<SliderItem[]> => {
  const { state } = useProceduralTextureState()
  return computed(() => {
    const params = state.plainWeaveAdvancedParams || defaultPlainWeaveAdvancedParams
    return [
      ...createSheenAndNormalSliders(params),
      ...createRoughnessSliders(params)
    ]
  })
}

/**
 * 滑块面板配置
 */
export const useSliderPanels = (): ComputedRef<Array<{ title: string; modelKey: string; items: SliderItem[] }>> => {
  const basicWeaveSliderItems = useBasicWeaveSliderItems()
  const threadWeaveSliderItems = useThreadWeaveSliderItems()
  const advancedWeaveSliderItems = useAdvancedWeaveSliderItems()
  const materialWeaveSliderItems = useMaterialWeaveSliderItems()

  return computed(() => {
    const panels = [
      {
        title: PANEL_TITLES.BASIC_PARAMETERS,
        modelKey: PLAIN_WEAVE_PANEL_KEYS.SHOW_BASIC_PARAMS,
        items: basicWeaveSliderItems.value
      },
      {
        title: PANEL_TITLES.THREAD_STRUCTURE,
        modelKey: PLAIN_WEAVE_PANEL_KEYS.SHOW_THREAD_PARAMS,
        items: threadWeaveSliderItems.value
      },
      {
        title: PANEL_TITLES.ADVANCED_PARAMETERS,
        modelKey: PLAIN_WEAVE_PANEL_KEYS.SHOW_ADVANCED_PARAMS,
        items: advancedWeaveSliderItems.value
      },
      {
        title: PANEL_TITLES.MATERIAL_PROPERTIES,
        modelKey: PLAIN_WEAVE_PANEL_KEYS.SHOW_MATERIAL_PARAMS,
        items: materialWeaveSliderItems.value
      }
    ]
    return panels
  })
}
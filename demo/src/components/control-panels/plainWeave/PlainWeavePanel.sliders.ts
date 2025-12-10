import { computed, useProceduralTextureState } from './imports'
import type { SliderItem, ComputedRef } from './imports'
import type { SliderConfig, PlainWeaveParams } from './PlainWeavePanel.types'
import {
  SLIDER_IDS,
  SLIDER_LABELS,
  PANEL_TITLES,
  VALUE_POSITION,
  PLAIN_WEAVE_PANEL_KEYS
} from './PlainWeavePanel.constants'

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
    const items: SliderItem[] = [
      createSliderItem({
        id: SLIDER_IDS.TILE_SIZE,
        label: SLIDER_LABELS.TILE_SIZE,
        value: state.plainWeaveParams.tileSize,
        min: 0.1,
        max: 5.0,
        step: 0.1
      }),
      createSliderItem({
        id: SLIDER_IDS.THREAD_DENSITY,
        label: SLIDER_LABELS.THREAD_DENSITY,
        value: state.plainWeaveParams.threadDensity,
        min: 5.0,
        max: 50.0,
        step: 1.0
      }),
      createSliderItem({
        id: SLIDER_IDS.THREAD_THICKNESS,
        label: SLIDER_LABELS.THREAD_THICKNESS,
        value: state.plainWeaveParams.threadThickness,
        min: 0.1,
        max: 1.0,
        step: 0.05
      }),
      createSliderItem({
        id: SLIDER_IDS.WARP_WEFT_RATIO,
        label: SLIDER_LABELS.WARP_WEFT_RATIO,
        value: state.plainWeaveParams.warpWeftRatio,
        min: 0.5,
        max: 2.0,
        step: 0.1
      })
    ]
    return items
  })
}

/**
 * 创建线纤维特性滑块项
 */
function createThreadFiberSliders(params: PlainWeaveParams): SliderItem[] {
  return [
    createSliderItem({
      id: SLIDER_IDS.THREAD_TWIST,
      label: SLIDER_LABELS.THREAD_TWIST,
      value: params.threadTwist,
      min: 0.0,
      max: 1.0,
      step: 0.05
    }),
    createSliderItem({
      id: SLIDER_IDS.FIBER_DETAIL,
      label: SLIDER_LABELS.FIBER_DETAIL,
      value: params.fiberDetail,
      min: 0.0,
      max: 1.0,
      step: 0.05
    }),
    createSliderItem({
      id: SLIDER_IDS.FUZZINESS,
      label: SLIDER_LABELS.FUZZINESS,
      value: params.fuzziness,
      min: 0.0,
      max: 1.0,
      step: 0.05
    })
  ]
}

/**
 * 创建编织结构滑块项
 */
function createWeaveStructureSliders(params: PlainWeaveParams): SliderItem[] {
  return [
    createSliderItem({
      id: SLIDER_IDS.WEAVE_TIGHTNESS,
      label: SLIDER_LABELS.WEAVE_TIGHTNESS,
      value: params.weaveTightness,
      min: 0.0,
      max: 1.0,
      step: 0.05
    }),
    createSliderItem({
      id: SLIDER_IDS.THREAD_UNEVENNESS,
      label: SLIDER_LABELS.THREAD_UNEVENNESS,
      value: params.threadUnevenness,
      min: 0.0,
      max: 1.0,
      step: 0.05
    }),
    createSliderItem({
      id: SLIDER_IDS.WEAVE_IMPERFECTION,
      label: SLIDER_LABELS.WEAVE_IMPERFECTION,
      value: params.weaveImperfection,
      min: 0.0,
      max: 1.0,
      step: 0.05
    })
  ]
}

/**
 * 线结构参数滑块配置
 */
export const useThreadWeaveSliderItems = (): ComputedRef<SliderItem[]> => {
  const { state } = useProceduralTextureState()
  return computed(() => [
    ...createThreadFiberSliders(state.plainWeaveParams),
    ...createWeaveStructureSliders(state.plainWeaveParams)
  ])
}

/**
 * 创建噪声和FBM滑块项
 */
function createNoiseAndFBMSliders(params: PlainWeaveParams): SliderItem[] {
  return [
    createSliderItem({
      id: SLIDER_IDS.FBM_OCTAVES,
      label: SLIDER_LABELS.FBM_OCTAVES,
      value: params.fbmOctaves,
      min: 1,
      max: 5,
      step: 1
    }),
    createSliderItem({
      id: SLIDER_IDS.FBM_AMPLITUDE,
      label: SLIDER_LABELS.FBM_AMPLITUDE,
      value: params.fbmAmplitude,
      min: 0.1,
      max: 1.0,
      step: 0.05
    }),
    createSliderItem({
      id: SLIDER_IDS.NOISE_FREQUENCY,
      label: SLIDER_LABELS.NOISE_FREQUENCY,
      value: params.noiseFrequency,
      min: 1.0,
      max: 10.0,
      step: 0.5
    })
  ]
}

/**
 * 创建视觉增强滑块项
 */
function createVisualEnhancementSliders(params: PlainWeaveParams): SliderItem[] {
  return [
    createSliderItem({
      id: SLIDER_IDS.COLOR_VARIATION,
      label: SLIDER_LABELS.COLOR_VARIATION,
      value: params.colorVariation,
      min: 0.0,
      max: 0.2,
      step: 0.01
    }),
    createSliderItem({
      id: SLIDER_IDS.THREAD_HEIGHT_SCALE,
      label: SLIDER_LABELS.THREAD_HEIGHT_SCALE,
      value: params.threadHeightScale,
      min: 0.5,
      max: 2.0,
      step: 0.1
    }),
    createSliderItem({
      id: SLIDER_IDS.THREAD_SHADOW_STRENGTH,
      label: SLIDER_LABELS.THREAD_SHADOW_STRENGTH,
      value: params.threadShadowStrength,
      min: 0.0,
      max: 1.0,
      step: 0.05
    })
  ]
}

/**
 * 高级编织参数滑块配置
 */
export const useAdvancedWeaveSliderItems = (): ComputedRef<SliderItem[]> => {
  const { state } = useProceduralTextureState()
  return computed(() => [
    ...createNoiseAndFBMSliders(state.plainWeaveParams),
    ...createVisualEnhancementSliders(state.plainWeaveParams)
  ])
}

/**
 * 创建光泽和法线滑块项
 */
function createSheenAndNormalSliders(params: PlainWeaveParams): SliderItem[] {
  return [
    createSliderItem({
      id: SLIDER_IDS.WARP_SHEEN,
      label: SLIDER_LABELS.WARP_SHEEN,
      value: params.warpSheen,
      min: 0.0,
      max: 1.0,
      step: 0.05
    }),
    createSliderItem({
      id: SLIDER_IDS.WEFT_SHEEN,
      label: SLIDER_LABELS.WEFT_SHEEN,
      value: params.weftSheen,
      min: 0.0,
      max: 1.0,
      step: 0.05
    }),
    createSliderItem({
      id: SLIDER_IDS.NORMAL_STRENGTH,
      label: SLIDER_LABELS.NORMAL_STRENGTH,
      value: params.normalStrength,
      min: 1.0,
      max: 20.0,
      step: 0.5
    })
  ]
}

/**
 * 创建粗糙度滑块项
 */
function createRoughnessSliders(params: PlainWeaveParams): SliderItem[] {
  return [
    createSliderItem({
      id: SLIDER_IDS.ROUGHNESS_MIN,
      label: SLIDER_LABELS.ROUGHNESS_MIN,
      value: params.roughnessMin,
      min: 0.3,
      max: 0.7,
      step: 0.05
    }),
    createSliderItem({
      id: SLIDER_IDS.ROUGHNESS_MAX,
      label: SLIDER_LABELS.ROUGHNESS_MAX,
      value: params.roughnessMax,
      min: 0.7,
      max: 1.0,
      step: 0.05
    })
  ]
}

/**
 * 材料编织参数滑块配置
 */
export const useMaterialWeaveSliderItems = (): ComputedRef<SliderItem[]> => {
  const { state } = useProceduralTextureState()
  return computed(() => [
    ...createSheenAndNormalSliders(state.plainWeaveParams),
    ...createRoughnessSliders(state.plainWeaveParams)
  ])
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
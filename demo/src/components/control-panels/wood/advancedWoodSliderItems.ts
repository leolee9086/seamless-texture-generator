import {
    FBM_OCTAVES,
    FBM_OCTAVES_LABEL,
    FBM_AMPLITUDE,
    FBM_AMPLITUDE_LABEL,
    KNOT_FREQUENCY,
    KNOT_FREQUENCY_LABEL,
    DISTORTION_FREQ,
    DISTORTION_FREQ_LABEL,
    RING_NOISE_FREQ,
    RING_NOISE_FREQ_LABEL,
    RAY_FREQUENCY_X,
    RAY_FREQUENCY_X_LABEL,
    RAY_FREQUENCY_Y,
    RAY_FREQUENCY_Y_LABEL,
    KNOT_THRESHOLD_MIN,
    KNOT_THRESHOLD_MIN_LABEL,
    KNOT_THRESHOLD_MAX,
    KNOT_THRESHOLD_MAX_LABEL
} from './woodSlider.constants'
import { createWoodSliderItems } from './woodSlider.utils'
import type { SliderConfig, ParamValueGetter } from './types'
import type { ProceduralTextureState } from './imports'

// 滑块配置数组
const advancedSliderConfigs: SliderConfig[] = [
    {
        id: FBM_OCTAVES,
        label: FBM_OCTAVES_LABEL,
        min: 1,
        max: 5,
        step: 1
    },
    {
        id: FBM_AMPLITUDE,
        label: FBM_AMPLITUDE_LABEL,
        min: 0.1,
        max: 1.0,
        step: 0.05
    },
    {
        id: KNOT_FREQUENCY,
        label: KNOT_FREQUENCY_LABEL,
        min: 0.5,
        max: 2.0,
        step: 0.1
    },
    {
        id: DISTORTION_FREQ,
        label: DISTORTION_FREQ_LABEL,
        min: 1.0,
        max: 3.0,
        step: 0.1
    },
    {
        id: RING_NOISE_FREQ,
        label: RING_NOISE_FREQ_LABEL,
        min: 3.0,
        max: 10.0,
        step: 0.5
    },
    {
        id: RAY_FREQUENCY_X,
        label: RAY_FREQUENCY_X_LABEL,
        min: 10.0,
        max: 300.0,
        step: 5.0
    },
    {
        id: RAY_FREQUENCY_Y,
        label: RAY_FREQUENCY_Y_LABEL,
        min: 1.0,
        max: 50.0,
        step: 0.5
    },
    {
        id: KNOT_THRESHOLD_MIN,
        label: KNOT_THRESHOLD_MIN_LABEL,
        min: 0.0,
        max: 1.0,
        step: 0.05
    },
    {
        id: KNOT_THRESHOLD_MAX,
        label: KNOT_THRESHOLD_MAX_LABEL,
        min: 0.0,
        max: 1.0,
        step: 0.05
    }
]

// 参数值获取函数数组
const advancedValueGetters: ParamValueGetter[] = [
    (state: ProceduralTextureState): number => state.woodParams.fbmOctaves,
    (state: ProceduralTextureState): number => state.woodParams.fbmAmplitude,
    (state: ProceduralTextureState): number => state.woodParams.knotFrequency,
    (state: ProceduralTextureState): number => state.woodParams.distortionFreq,
    (state: ProceduralTextureState): number => state.woodParams.ringNoiseFreq,
    (state: ProceduralTextureState): number => state.woodParams.rayFrequencyX,
    (state: ProceduralTextureState): number => state.woodParams.rayFrequencyY,
    (state: ProceduralTextureState): number => state.woodParams.knotThresholdMin,
    (state: ProceduralTextureState): number => state.woodParams.knotThresholdMax
]

// 使用通用工具函数创建滑块项
export const advancedWoodSliderItems = createWoodSliderItems(advancedSliderConfigs, advancedValueGetters)
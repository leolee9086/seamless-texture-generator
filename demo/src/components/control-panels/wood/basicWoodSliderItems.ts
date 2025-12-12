import {
    TILE_SIZE,
    TILE_SIZE_LABEL,
    RING_SCALE,
    RING_SCALE_LABEL,
    RING_DISTORTION,
    RING_DISTORTION_LABEL,
    KNOT_INTENSITY,
    KNOT_INTENSITY_LABEL,
    LATEWOOD_BIAS,
    LATEWOOD_BIAS_LABEL,
    RAY_STRENGTH,
    RAY_STRENGTH_LABEL,
    PORE_DENSITY,
    PORE_DENSITY_LABEL
} from './woodSlider.constants'
import { createWoodSliderItems } from './woodSlider.utils'
import type { SliderConfig, ParamValueGetter } from './types'
import type { ProceduralTextureState } from './imports'

// 滑块配置数组
const basicSliderConfigs: SliderConfig[] = [
    {
        id: TILE_SIZE,
        label: TILE_SIZE_LABEL,
        min: 0.1,
        max: 5.0,
        step: 0.1
    },
    {
        id: RING_SCALE,
        label: RING_SCALE_LABEL,
        min: 1.0,
        max: 20.0,
        step: 0.5
    },
    {
        id: RING_DISTORTION,
        label: RING_DISTORTION_LABEL,
        min: 0.0,
        max: 3.0,
        step: 0.1
    },
    {
        id: KNOT_INTENSITY,
        label: KNOT_INTENSITY_LABEL,
        min: 0.0,
        max: 5.0,
        step: 0.1
    },
    {
        id: LATEWOOD_BIAS,
        label: LATEWOOD_BIAS_LABEL,
        min: 0.1,
        max: 5.0,
        step: 0.1
    },
    {
        id: RAY_STRENGTH,
        label: RAY_STRENGTH_LABEL,
        min: 0.0,
        max: 10.0,
        step: 0.05
    },
    {
        id: PORE_DENSITY,
        label: PORE_DENSITY_LABEL,
        min: 0.0,
        max: 150.0,
        step:0.01
    }
]

// 参数值获取函数数组
const basicValueGetters: ParamValueGetter[] = [
    (state: ProceduralTextureState): number => state.woodParams.tileSize,
    (state: ProceduralTextureState): number => state.woodParams.ringScale,
    (state: ProceduralTextureState): number => state.woodParams.ringDistortion,
    (state: ProceduralTextureState): number => state.woodParams.knotIntensity,
    (state: ProceduralTextureState): number => state.woodParams.latewoodBias,
    (state: ProceduralTextureState): number => state.woodParams.rayStrength,
    (state: ProceduralTextureState): number => state.woodParams.poreDensity
]

// 使用通用工具函数创建滑块项
export const basicWoodSliderItems = createWoodSliderItems(basicSliderConfigs, basicValueGetters)


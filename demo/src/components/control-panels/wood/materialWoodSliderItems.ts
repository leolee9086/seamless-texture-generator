import {
    NORMAL_STRENGTH,
    NORMAL_STRENGTH_LABEL,
    ROUGHNESS_MIN,
    ROUGHNESS_MIN_LABEL,
    ROUGHNESS_MAX,
    ROUGHNESS_MAX_LABEL
} from './woodSlider.constants'
import { createWoodSliderItems } from './woodSlider.utils'
import type { SliderConfig, ParamValueGetter } from './types'
import type { ProceduralTextureState } from './imports'

// 滑块配置数组
const materialSliderConfigs: SliderConfig[] = [
    {
        id: NORMAL_STRENGTH,
        label: NORMAL_STRENGTH_LABEL,
        min: 1.0,
        max: 20.0,
        step: 0.5
    },
    {
        id: ROUGHNESS_MIN,
        label: ROUGHNESS_MIN_LABEL,
        min: 0.1,
        max: 0.5,
        step: 0.05
    },
    {
        id: ROUGHNESS_MAX,
        label: ROUGHNESS_MAX_LABEL,
        min: 0.5,
        max: 1.0,
        step: 0.05
    }
]

// 参数值获取函数数组
const materialValueGetters: ParamValueGetter[] = [
    (state: ProceduralTextureState): number => state.woodParams.normalStrength,
    (state: ProceduralTextureState): number => state.woodParams.roughnessMin,
    (state: ProceduralTextureState): number => state.woodParams.roughnessMax
]

// 使用通用工具函数创建滑块项
export const materialWoodSliderItems = createWoodSliderItems(materialSliderConfigs, materialValueGetters)
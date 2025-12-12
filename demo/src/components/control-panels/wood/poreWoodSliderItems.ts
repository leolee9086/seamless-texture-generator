import {
    PORE_SCALE,
    PORE_SCALE_LABEL,
    PORE_THRESHOLD_EARLY,
    PORE_THRESHOLD_EARLY_LABEL,
    PORE_THRESHOLD_LATE,
    PORE_THRESHOLD_LATE_LABEL,
    PORE_THRESHOLD_RANGE,
    PORE_THRESHOLD_RANGE_LABEL,
    PORE_STRENGTH,
    PORE_STRENGTH_LABEL
} from './woodSlider.constants'
import { createWoodSliderItems } from './woodSlider.utils'
import type { SliderConfig, ParamValueGetter } from './woodPanel.types'
import type { ProceduralTextureState } from './imports'

// 滑块配置数组
const poreSliderConfigs: SliderConfig[] = [
    {
        id: PORE_SCALE,
        label: PORE_SCALE_LABEL,
        min: 0.1,
        max: 5.0,
        step: 0.1
    },
    {
        id: PORE_THRESHOLD_EARLY,
        label: PORE_THRESHOLD_EARLY_LABEL,
        min: 0.0,
        max: 1.0,
        step: 0.01
    },
    {
        id: PORE_THRESHOLD_LATE,
        label: PORE_THRESHOLD_LATE_LABEL,
        min: 0.0,
        max: 1.0,
        step: 0.01
    },
    {
        id: PORE_THRESHOLD_RANGE,
        label: PORE_THRESHOLD_RANGE_LABEL,
        min: 0.05,
        max: 0.5,
        step: 0.01
    },
    {
        id: PORE_STRENGTH,
        label: PORE_STRENGTH_LABEL,
        min: 0.0,
        max: 1.0,
        step: 0.01
    }
]

// 参数值获取函数数组
const poreValueGetters: ParamValueGetter[] = [
    (state: ProceduralTextureState): number => state.woodParams.poreScale,
    (state: ProceduralTextureState): number => state.woodParams.poreThresholdEarly,
    (state: ProceduralTextureState): number => state.woodParams.poreThresholdLate,
    (state: ProceduralTextureState): number => state.woodParams.poreThresholdRange,
    (state: ProceduralTextureState): number => state.woodParams.poreStrength
]

// 使用通用工具函数创建滑块项
export const poreWoodSliderItems = createWoodSliderItems(poreSliderConfigs, poreValueGetters)
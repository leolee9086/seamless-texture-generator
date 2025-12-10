import type { Ref } from './imports'
import type { DehazeParams, ControlEvent, DehazePreset } from './imports'

/**
 * 去雾面板的上下文接口
 */
export interface DehazePanelContext {
    dehazeParams: Ref<DehazeParams>
    currentPreset: Ref<DehazePreset | null>
    showAdvanced: Ref<boolean>
    isProcessing: Ref<boolean>
    emit: (event: 'controlEvent', data: ControlEvent) => void
}

/**
 * 参数更新数据接口
 */
export interface ParamUpdateData {
    id: string
    value: number
}

/**
 * 滑块参数配置接口（如果需要）
 */
export interface SliderParamConfig {
    id: keyof DehazeParams
    label: string
    min: number
    max: number
    step: number
    gradient: string
    showRuler: boolean
}
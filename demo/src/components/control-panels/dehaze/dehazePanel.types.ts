import type { Ref } from './imports'
import type { DehazeParams, ControlEvent, DehazePreset } from './imports'

/**
 * 去雾面板的状态接口（纯数据）
 */
export interface DehazePanelState {
    dehazeParams: Ref<DehazeParams>
    currentPreset: Ref<DehazePreset | null>
    showAdvanced: Ref<boolean>
    isProcessing: Ref<boolean>
}

/**
 * 去雾面板的行为类型（纯方法）
 */
export type DehazePanelActions = (event: 'controlEvent', data: ControlEvent) => void

/**
 * 去雾面板的上下文类型（状态与行为的组合）
 */
export type DehazePanelContext = DehazePanelState & {
    emit: DehazePanelActions
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
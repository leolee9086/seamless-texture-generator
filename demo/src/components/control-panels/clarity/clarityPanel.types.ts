import type { Ref } from './imports'
import type { ClarityParams, ControlEvent } from './imports'

/**
 * 清晰度面板的状态接口（纯数据）
 */
export interface ClarityPanelContextState {
    clarityParams: Ref<ClarityParams>
    currentPreset: Ref<string | null>
}

/**
 * 控制事件发射器类型
 */
export type ClarityPanelEmit = (event: 'controlEvent', data: ControlEvent) => void

/**
 * 清晰度面板的上下文接口（纯数据包装器）
 * 包含状态和事件发射器引用
 */
export interface ClarityPanelContext {
    state: ClarityPanelContextState
    emit: ClarityPanelEmit
}

/**
 * 参数更新数据接口
 */
export interface ParamUpdateData {
    id: string
    value: number
}

/**
 * 滑块参数配置接口
 */
export interface SliderParamConfig {
    id: keyof ClarityParams
    label: string
    min: number
    max: number
    step: number
    gradient: string
    showRuler: boolean
}
import type { Ref } from './imports'
import type { ClarityParams, ControlEvent } from './imports'

/**
 * 清晰度面板的上下文接口
 */
export interface ClarityPanelContext {
    clarityParams: Ref<ClarityParams>
    currentPreset: Ref<string | null>
    emit: (event: 'controlEvent', data: ControlEvent) => void
}

/**
 * 参数更新数据接口
 */
export interface ParamUpdateData {
    id: string
    value: number
}
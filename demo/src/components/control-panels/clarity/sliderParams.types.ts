import type { ClarityParams } from './imports'

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
import type { SliderParamConfig } from './sliderParams.types'
import type { ClarityParams, SliderItem } from './imports'

/**
 * 滤波参数配置
 */
export const filterParams: SliderParamConfig[] = [
    {
        id: 'sigma',
        label: 'Sigma',
        min: 1.0,
        max: 16.0,
        step: 0.5,
        gradient: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)',
        showRuler: false
    },
    {
        id: 'epsilon',
        label: 'Epsilon',
        min: 0.01,
        max: 0.1,
        step: 0.01,
        gradient: 'linear-gradient(90deg, #10b981 0%, #34d399 100%)',
        showRuler: false
    },
    {
        id: 'radius',
        label: 'Radius',
        min: 4,
        max: 32,
        step: 2,
        gradient: 'linear-gradient(90deg, #f59e0b 0%, #f97316 100%)',
        showRuler: true
    },
    {
        id: 'blockSize',
        label: 'Block Size',
        min: 8,
        max: 32,
        step: 8,
        gradient: 'linear-gradient(90deg, #8b5cf6 0%, #6366f1 100%)',
        showRuler: true
    }
]

/**
 * 增强参数配置
 */
export const enhancementParams: SliderParamConfig[] = [
    {
        id: 'detailStrength',
        label: 'Detail Strength',
        min: 0.1,
        max: 20.0,
        step: 0.1,
        gradient: 'linear-gradient(90deg, #06b6d4 0%, #10b981 100%)',
        showRuler: false
    },
    {
        id: 'enhancementStrength',
        label: 'Enhancement Strength',
        min: 0.1,
        max: 10.0,
        step: 0.1,
        gradient: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)',
        showRuler: false
    },
    {
        id: 'macroEnhancement',
        label: 'Macro Enhancement',
        min: 0.0,
        max: 2.0,
        step: 0.1,
        gradient: 'linear-gradient(90deg, #f59e0b 0%, #f97316 100%)',
        showRuler: false
    },
    {
        id: 'contrastBoost',
        label: 'Contrast Boost',
        min: 1.0,
        max: 3.0,
        step: 0.1,
        gradient: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)',
        showRuler: false
    }
]

/**
 * 根据配置生成 SliderItem
 * @param param 参数配置
 * @param clarityParams 清晰度参数
 * @returns SliderItem 对象
 */
export const createSliderItem = (
    param: SliderParamConfig,
    clarityParams: ClarityParams
): SliderItem => ({
    id: param.id,
    label: param.label,
    value: clarityParams[param.id],
    min: param.min,
    max: param.max,
    step: param.step,
    gradient: param.gradient,
    showRuler: param.showRuler
})
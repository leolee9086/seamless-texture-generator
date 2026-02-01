/**
 * 水印设置滑块配置工具
 */
import type { 水印配置, SliderItemConfig, SliderHandler } from './watermark.types'
import { 配置范围 } from './watermark.constants'
import { normalizeSpacing } from './watermark.guard'

/** 滑块项配置常量 */
const SLIDER_VALUE_POSITION = 'after' as const
const SLIDER_SHOW_RULER = false as const

/**
 * 构建滑块项列表
 * @param config 水印配置
 * @returns 滑块项数组
 */
export function buildSliderItems(config: 水印配置): SliderItemConfig[] {
    const 间距 = normalizeSpacing(config.网格间距)
    const base: SliderItemConfig[] = [
        { id: 'wm-fontsize', label: 'Size', value: config.字体大小, ...配置范围.字体大小, valuePosition: SLIDER_VALUE_POSITION, showRuler: SLIDER_SHOW_RULER },
        { id: 'wm-opacity', label: 'Opacity', value: config.不透明度, ...配置范围.不透明度, valuePosition: SLIDER_VALUE_POSITION, showRuler: SLIDER_SHOW_RULER }
    ]
    if (config.样式 !== 'grid') return base
    return [
        ...base,
        { id: 'wm-row-spacing', label: 'Row', value: 间距.行间距, ...配置范围.行间距, valuePosition: SLIDER_VALUE_POSITION, showRuler: SLIDER_SHOW_RULER },
        { id: 'wm-col-spacing', label: 'Col', value: 间距.列间距, ...配置范围.列间距, valuePosition: SLIDER_VALUE_POSITION, showRuler: SLIDER_SHOW_RULER },
        { id: 'wm-rotation', label: 'Rot', value: config.旋转角度 ?? 45, ...配置范围.旋转角度, valuePosition: SLIDER_VALUE_POSITION, showRuler: SLIDER_SHOW_RULER }
    ]
}

/**
 * 创建滑块处理器映射
 * @param config 当前配置
 * @param updateFn 更新函数
 * @returns 处理器映射
 */
export function createSliderHandlers(
    config: 水印配置,
    updateFn: (partial: Partial<水印配置>) => void
): Record<string, SliderHandler> {
    const 间距 = normalizeSpacing(config.网格间距)
    return {
        'wm-fontsize': (value: number): void => updateFn({ 字体大小: value }),
        'wm-opacity': (value: number): void => updateFn({ 不透明度: value }),
        'wm-row-spacing': (value: number): void => updateFn({ 网格间距: { ...间距, 行间距: value } }),
        'wm-col-spacing': (value: number): void => updateFn({ 网格间距: { ...间距, 列间距: value } }),
        'wm-rotation': (value: number): void => updateFn({ 旋转角度: value })
    }
}

import { computed, type ComputedRef, type SliderItem, type ProceduralTextureState } from './imports'
import type { SliderConfig, ParamValueGetter } from './types'

/**
 * 创建单个滑块项的工厂函数
 * @param config 滑块配置
 * @param getValue 获取参数值的函数
 * @returns 返回创建滑块项的函数
 */
export const createSliderItemFactory = (
    config: SliderConfig,
    getValue: ParamValueGetter
): ((state: ProceduralTextureState) => SliderItem) => {
    return (state: ProceduralTextureState): SliderItem => ({
        id: config.id,
        label: config.label,
        value: getValue(state),
        min: config.min,
        max: config.max,
        step: config.step,
        valuePosition: config.valuePosition || 'after' as const,
        showRuler: config.showRuler || false
    })
}

/**
 * 创建滑块项数组的工厂函数
 * @param itemFactories 滑块项工厂函数数组
 * @returns 返回创建滑块项数组的函数
 */
export const createSliderItemsFactory = (
    itemFactories: Array<(state: ProceduralTextureState) => SliderItem>
): ((state: ProceduralTextureState) => SliderItem[]) => {
    return (state: ProceduralTextureState): SliderItem[] =>
        itemFactories.map(factory => factory(state))
}

/**
 * 创建计算属性的工厂函数
 * @param createItems 创建滑块项数组的函数
 * @returns 返回计算属性函数
 */
export const createComputedSliderItems = (
    createItems: (state: ProceduralTextureState) => SliderItem[]
): ((state: ProceduralTextureState) => ComputedRef<SliderItem[]>) => {
    return (state: ProceduralTextureState): ComputedRef<SliderItem[]> => {
        return computed(() => createItems(state))
    }
}

/**
 * 完整的滑块项创建流程
 * @param configs 滑块配置数组
 * @param valueGetters 参数值获取函数数组
 * @returns 返回计算属性函数
 */
export const createWoodSliderItems = (
    configs: SliderConfig[],
    valueGetters: ParamValueGetter[]
): ((state: ProceduralTextureState) => ComputedRef<SliderItem[]>) => {
    const itemFactories = configs.map((config, index) =>
        createSliderItemFactory(config, valueGetters[index])
    )
    
    const createItems = createSliderItemsFactory(itemFactories)
    
    return createComputedSliderItems(createItems)
}
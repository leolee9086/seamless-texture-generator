import { DehazeParams, computed, Ref, ComputedRef, SliderItem } from './imports'
import { isValidDehazeParamKey, isNumericDehazeParamKey, isNumber } from './dehazeParams.guard'
import { INVALID_PARAM_KEY_WARNING_TEMPLATE } from './dehazePanel.templates'

export function createSliderItemsComputed(
    paramsDef: Array<{ id: string; label: string; min: number; max: number; step: number; gradient: string; showRuler: boolean }>,
    dehazeParams: Ref<DehazeParams>
): ComputedRef<SliderItem[]> {
    return computed(() =>
        paramsDef.map(item => {
            const key = item.id
            if (!isValidDehazeParamKey(key)) {
                // 这不应该发生，因为 paramsDef 来自验证过的配置
                throw new Error(INVALID_PARAM_KEY_WARNING_TEMPLATE(key))
            }
            if (!isNumericDehazeParamKey(key)) {
                // 跳过非数字参数（例如布尔值），因为它们不应出现在滑块中
                // 返回一个占位符值，但这不应该发生
                return {
                    ...item,
                    value: 0
                }
            }
            const value = dehazeParams.value[key]
            // 确保 value 是数字（因为 isNumericDehazeParamKey 保证是数字）
            if (!isNumber(value)) {
                // 回退到默认值
                return {
                    ...item,
                    value: 0
                }
            }
            return {
                ...item,
                value
            }
        })
    )
}
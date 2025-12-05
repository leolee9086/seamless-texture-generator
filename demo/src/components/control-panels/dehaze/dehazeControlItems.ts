import { DehazeParams } from "@/adjustments/dehaze/types"
import { BasicParamsUIDefine, AdvancedParamsUIDefine, EnhancementParamsUIDefine } from "@/adjustments/dehaze/validateDehazeParams"
import { computed, Ref } from "vue"

export const createBasicSliderItemsComputed = (dehazeParams: Ref<DehazeParams>) => {
    return computed(() =>
        BasicParamsUIDefine.map(item => ({
            ...item,
            value: dehazeParams.value[item.id as keyof DehazeParams] as number
        }))
    )
}

export const createAdvancedSliderItemsComputed = (dehazeParams: Ref<DehazeParams>) => {
    return computed(() =>
        AdvancedParamsUIDefine.map(item => ({
            ...item,
            value: dehazeParams.value[item.id as keyof DehazeParams] as number
        }))
    )
}

export const createEnhancementSliderItemsComputed = (dehazeParams: Ref<DehazeParams>) => {
    return computed(() =>
        EnhancementParamsUIDefine.map(item => ({
            ...item,
            value: dehazeParams.value[item.id as keyof DehazeParams] as number
        }))
    )
}
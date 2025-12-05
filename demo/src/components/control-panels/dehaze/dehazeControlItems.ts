import { DehazeParams } from "@/adjustments/dehaze/types"
import { computed, Ref } from "vue"

export const createBasicSliderItemsComputed = (dehazeParams: Ref<DehazeParams>) => {
    return computed(() => [
        {
            id: 'omega',
            label: '去雾强度',
            value: dehazeParams.value.omega,
            min: 0.1,
            max: 0.99,
            step: 0.01,
            gradient: 'linear-gradient(90deg, #007aff 0%, #5ac8fa 50%, #ffffff 100%)',
            showRuler: true
        },
        {
            id: 't0',
            label: '透射率阈值',
            value: dehazeParams.value.t0,
            min: 0.01,
            max: 0.3,
            step: 0.01,
            gradient: 'linear-gradient(90deg, #ff3b30 0%, #ffcc00 50%, #4cd964 100%)',
            showRuler: true
        },
        {
            id: 'windowSize',
            label: '窗口大小',
            value: dehazeParams.value.windowSize,
            min: 0,
            max: 31,
            step: 1,
            gradient: 'linear-gradient(90deg, #5856d6 0%, #af52de 100%)',
            showRuler: true
        }
    ]
    )
}

export const createAdvancedSliderItemsComputed = (dehazeParams: Ref<DehazeParams>) => {
    return computed(() => [
        {
            id: 'topRatio',
            label: '大气光比例',
            value: dehazeParams.value.topRatio,
            min: 0.01,
            max: 0.5,
            step: 0.01,
            gradient: 'linear-gradient(90deg, #ff9500 0%, #ffcc00 100%)',
            showRuler: true
        },
        {
            id: 'adaptiveStrength',
            label: '自适应强度',
            value: dehazeParams.value.adaptiveStrength,
            min: 0.1,
            max: 2.0,
            step: 0.01,
            gradient: 'linear-gradient(90deg, #34c759 0%, #30d158 100%)',
            showRuler: true
        },
        {
            id: 'hazeWeight',
            label: '雾强度权重',
            value: dehazeParams.value.hazeWeight,
            min: 0.0,
            max: 1.0,
            step: 0.01,
            gradient: 'linear-gradient(90deg, #007aff 0%, #5ac8fa 100%)',
            showRuler: true
        },
        {
            id: 'atmosphericWeight',
            label: '大气光权重',
            value: dehazeParams.value.atmosphericWeight,
            min: 0.0,
            max: 1.0,
            step: 0.01,
            gradient: 'linear-gradient(90deg, #ff2d55 0%, #ff3b30 100%)',
            showRuler: true
        }
    ])
}

export const createEnhancementSliderItemsComputed = (dehazeParams: Ref<DehazeParams>) => {
    return computed(() => [
        {
            id: 'saturationEnhancement',
            label: '饱和度增强',
            value: dehazeParams.value.saturationEnhancement,
            min: 0.0,
            max: 2.0,
            step: 0.01,
            gradient: 'linear-gradient(90deg, #888 0%, #ff0000 100%)',
            showRuler: true
        },
        {
            id: 'contrastEnhancement',
            label: '对比度增强',
            value: dehazeParams.value.contrastEnhancement,
            min: 0.5,
            max: 2.0,
            step: 0.01,
            gradient: 'linear-gradient(90deg, #000 0%, #fff 100%)',
            showRuler: true
        },
        {
            id: 'brightnessEnhancement',
            label: '明度增强',
            value: dehazeParams.value.brightnessEnhancement,
            min: 0.5,
            max: 2.0,
            step: 0.01,
            gradient: 'linear-gradient(90deg, #000 0%, #888 50%, #fff 100%)',
            showRuler: true
        }
    ])
}
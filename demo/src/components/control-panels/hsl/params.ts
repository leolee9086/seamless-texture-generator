import { computed, Ref } from "vue";
import type { HSLAdjustmentLayer } from '../../../utils/hslAdjustStep'
import { z } from 'zod'

// 常用颜色配置
export const COMMON_COLORS = [
    '#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF',
    '#FF00FF', '#8B4513', '#FFFFFF', '#808080', '#000000', '#FFB6C1'
] as const

// 提取数字约束的辅助函数
const extractNumberConstraints = (schema: z.ZodNumber) => {
    let min = -100
    let max = 100
    let step = 1

    // 正确处理 minValue，检查 null、undefined 和 NaN
    if (schema.minValue !== undefined && schema.minValue !== null && !isNaN(schema.minValue)) {
        min = schema.minValue
    }

    // 正确处理 maxValue，检查 null、undefined 和 NaN
    if (schema.maxValue !== undefined && schema.maxValue !== null && !isNaN(schema.maxValue)) {
        max = schema.maxValue
    }

    // 正确处理 metaStep，检查 null、undefined 和 NaN
    const metaStep = schema.meta()?.step
    if (typeof metaStep === 'number' && !isNaN(metaStep)) {
        step = metaStep
    }

    return { min, max, step }
}

// 定义 Zod 元数据类型
export const MetaSchema = z.object({
    label: z.string(),
    gradient: z.string().optional(),
    showRuler: z.boolean().optional(),
    step: z.number().optional(),
    defaultValue: z.number().optional()
})


const getGlobalSchema = () => z.object({
    hue: z.number().min(-180).max(180).meta({
        step: 1,
        label: '色相',
        gradient: 'linear-gradient(90deg, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
        showRuler: false
    }),
    saturation: z.number().min(-100).max(100).meta({
        step: 1,
        label: '饱和度',
        gradient: 'linear-gradient(90deg, #888 0%, #ff0000 100%)',
        showRuler: false
    }),
    lightness: z.number().min(-100).max(100).meta({
        step: 1,
        label: '明度',
        gradient: 'linear-gradient(90deg, #000 0%, #888 50%, #fff 100%)',
        showRuler: false
    })
})

export const getLayerSchema = (layer: HSLAdjustmentLayer | null) => z.object({
    hue: z.number().min(-180).max(180).meta({
        step: 1,
        label: '色相',
        gradient: 'linear-gradient(90deg, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
        showRuler: false
    }),
    saturation: z.number().min(-100).max(100).meta({
        step: 1,
        label: '饱和度',
        gradient: `linear-gradient(90deg, #888 0%, ${layer?.targetColor || '#ff0000'} 100%)`,
        showRuler: false
    }),
    lightness: z.number().min(-100).max(100).meta({
        step: 1,
        label: '明度',
        gradient: `linear-gradient(90deg, #000 0%, ${layer?.targetColor || '#888'} 50%, #fff 100%)`,
        showRuler: false
    }),
    precision: z.number().min(0).max(100).meta({
        step: 1,
        label: '精确度',
        gradient: 'linear-gradient(90deg, #ff3b30 0%, #ffcc00 50%, #4cd964 100%)',
        showRuler: true,
        defaultValue: 30
    }),
    range: z.number().min(0).max(100).meta({
        step: 1,
        label: '羽化范围',
        gradient: 'linear-gradient(90deg, #007aff 0%, #5ac8fa 50%, #ffffff 100%)',
        showRuler: true,
        defaultValue: 50
    })
})

import type { SliderItem } from '@leolee9086/slider-component'

export const getGlobalSliderItems = (state: { globalHSL: Ref<{ hue: number; saturation: number; lightness: number }> }): { get(): SliderItem[], set(): void } => {
    const { globalHSL } = state
    const schema = getGlobalSchema()

    // 映射表，用于将schema key映射到组件需要的id
    const idMap: Record<string, string> = {
        hue: 'global-hue',
        saturation: 'global-saturation',
        lightness: 'global-lightness'
    }

    const define = {
        get: (): SliderItem[] => {
            return Object.entries(schema.shape).map(([key, zodSchema]) => {
                if (zodSchema instanceof z.ZodNumber) {
                    const constraints = extractNumberConstraints(zodSchema)
                    // 使用 Zod 验证元数据
                    const metaResult = MetaSchema.safeParse(zodSchema.meta())
                    const uiDesc = metaResult.success ? metaResult.data : { label: key }

                    // 检查 globalHSL 值的有效性
                    const globalValue = globalHSL.value[key as keyof typeof globalHSL.value]
                    let value: number
                    
                    // 首先检查 globalValue 是否为有效数字
                    if (globalValue != null && typeof globalValue === 'number' && !isNaN(globalValue)) {
                        value = globalValue
                    }
                    // 然后检查 defaultValue 是否为有效数字
                    else if (uiDesc.defaultValue != null && typeof uiDesc.defaultValue === 'number' && !isNaN(uiDesc.defaultValue)) {
                        value = uiDesc.defaultValue
                    }
                    // 如果实际值和默认值都有问题，直接报错
                    else {
                        throw new Error(`全局参数 ${key} 的实际值和默认值都无效，实际值: ${globalValue}，默认值: ${uiDesc.defaultValue}`)
                    }

                    return {
                        id: idMap[key] || key,
                        label: uiDesc.label,
                        value: value,
                        min: constraints.min,
                        max: constraints.max,
                        step: constraints.step,
                        gradient: uiDesc.gradient,
                        showRuler: uiDesc.showRuler
                    }
                }
                return null
            }).filter((item): item is NonNullable<typeof item> => item !== null)
        },
        set: () => { }
    }
    return define
}

export const getLayerSliderItems = (layer: HSLAdjustmentLayer): { get(): SliderItem[], set(): void } => {
    const schema = getLayerSchema(layer)
    const define = {
        get: (): SliderItem[] => {
            return Object.entries(schema.shape).map(([key, zodSchema]) => {
                if (zodSchema instanceof z.ZodNumber) {
                    const constraints = extractNumberConstraints(zodSchema)
                    // 使用 Zod 验证元数据
                    const metaResult = MetaSchema.safeParse(zodSchema.meta())

                    const uiDesc = metaResult.data
                    if (!uiDesc) {
                        throw new Error('元数据解析失败')
                    }
                    // 核心修复:使用 != null 同时检查 null 和 undefined,并且检查 isNaN
                    const layerValue = layer[key as keyof HSLAdjustmentLayer]
                    let value: number
                    
                    // 首先检查 layerValue 是否为有效数字
                    if (layerValue != null && typeof layerValue === 'number' && !isNaN(layerValue)) {
                        value = layerValue
                    }
                    // 然后检查 defaultValue 是否为有效数字
                    else if (uiDesc.defaultValue != null && typeof uiDesc.defaultValue === 'number' && !isNaN(uiDesc.defaultValue)) {
                        value = uiDesc.defaultValue
                    }
                    // 如果实际值和默认值都有问题，直接报错
                    else {
                        throw new Error(`参数 ${key} 的实际值和默认值都无效，实际值: ${layerValue}，默认值: ${uiDesc.defaultValue}`)
                    }

                    return {
                        id: key,
                        label: uiDesc.label,
                        value: value,
                        min: constraints.min,
                        max: constraints.max,
                        step: constraints.step,
                        gradient: uiDesc.gradient,
                        showRuler: uiDesc.showRuler
                    }
                }
                return null
            }).filter((item): item is NonNullable<typeof item> => item !== null)
        },
        set: () => {
            // 更新逻辑由HSLPanel.vue统一处理，这里不需要实现
        }
    }
    return define
}

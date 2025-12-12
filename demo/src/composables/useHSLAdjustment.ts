import { ref, type Ref } from 'vue'
import type { HSLAdjustmentLayer } from '../adjustments/hsl/hslAdjustStep'

/**
 * HSL 调整层管理
 */
export function useHSLAdjustment(
    globalHSL: Ref<{ hue: number; saturation: number; lightness: number }>,
    hslLayers: Ref<HSLAdjustmentLayer[]>
) {
    /** 构建完整的 HSL 调整层数组（全局 + 色块层） */
    const buildHSLLayers = (): HSLAdjustmentLayer[] => {
        const layers: HSLAdjustmentLayer[] = []

        // 如果有全局 HSL 调整，添加全局层
        const { hue, saturation, lightness } = globalHSL.value
        if (hue !== 0 || saturation !== 0 || lightness !== 0) {
            layers.push({
                id: 'global',
                type: 'global',
                targetColor: '#000000',
                hue,
                saturation,
                lightness,
                precision: 100,
                range: 100
            })
        }

        // 添加所有色块调整层
        layers.push(...hslLayers.value)
        return layers
    }

    /** 更新全局 HSL */
    const updateGlobalHSL = (layer: HSLAdjustmentLayer) => {
        globalHSL.value = {
            hue: layer.hue,
            saturation: layer.saturation,
            lightness: layer.lightness
        }
    }

    /** 添加 HSL 层 */
    const addHSLLayer = (layer: HSLAdjustmentLayer) => {
        hslLayers.value.push(layer)
    }

    /** 更新 HSL 层 */
    const updateHSLLayer = (id: string, updates: Partial<HSLAdjustmentLayer>) => {
        const layer = hslLayers.value.find(l => l.id === id)
        if (layer) {
            Object.assign(layer, updates)
        }
    }

    /** 移除 HSL 层 */
    const removeHSLLayer = (id: string) => {
        hslLayers.value = hslLayers.value.filter(l => l.id !== id)
    }

    return {
        buildHSLLayers,
        updateGlobalHSL,
        addHSLLayer,
        updateHSLLayer,
        removeHSLLayer,
    }
}

/** useHSLAdjustment 返回值类型 */
export type HSLAdjustment = ReturnType<typeof useHSLAdjustment>

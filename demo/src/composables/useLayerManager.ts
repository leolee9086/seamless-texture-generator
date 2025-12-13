import { Ref } from 'vue'
import { RGBColor } from '../utils/lut/colorQuantization'
import { HSLRange } from '../utils/lut/hslMask'
import { AdjustmentLayer } from './useColorBlockSelector.types'

/**
 * 图层管理 composable
 */
export function useLayerManager(
    layers: Ref<AdjustmentLayer[]>,
    activeLayerId: Ref<string | null>
) {
    /**
     * 添加量化颜色图层
     */
    const addColorLayer = (color: RGBColor): void => {
        const id = `quantized-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        layers.value.push({
            id,
            name: `Color RGB(${color.r},${color.g},${color.b})`,
            type: 'quantized',
            visible: true,
            intensity: 1.0,
            blendMode: 'max',
            color: { ...color },
            tolerance: 30
        })
        activeLayerId.value = id
    }

    /**
     * 添加HSL图层
     */
    const addHslLayer = (hslBlock: HSLRange): void => {
        const id = `hsl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        layers.value.push({
            id,
            name: hslBlock.name || 'Custom HSL',
            type: 'hsl',
            visible: true,
            intensity: 1.0,
            blendMode: 'max',
            hslRange: { ...hslBlock }
        })
        activeLayerId.value = id
    }

    /**
     * 移除图层
     */
    const removeLayer = (id: string): void => {
        const index = layers.value.findIndex(l => l.id === id)
        if (index > -1) {
            layers.value.splice(index, 1)
            if (activeLayerId.value === id) {
                activeLayerId.value = null
            }
        }
    }

    /**
     * 选择图层
     */
    const selectLayer = (id: string): void => {
        activeLayerId.value = id
    }

    /**
     * 更新图层
     */
    const updateLayer = (id: string, updates: Partial<AdjustmentLayer>): void => {
        const layer = layers.value.find(l => l.id === id)
        if (layer) {
            Object.assign(layer, updates)
        }
    }

    /**
     * 切换量化色块选择 (已废弃,保留用于兼容)
     */
    const toggleColorBlock = (_blockId: string, color: RGBColor): void => {
        addColorLayer(color)
    }

    /**
     * 切换HSL色块选择 (已废弃,保留用于兼容)
     */
    const toggleHslBlock = (_blockId: string, hslBlock: HSLRange): void => {
        addHslLayer(hslBlock)
    }

    return {
        addColorLayer,
        addHslLayer,
        removeLayer,
        selectLayer,
        updateLayer,
        toggleColorBlock,
        toggleHslBlock
    }
}

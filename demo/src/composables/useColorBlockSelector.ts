import { ref, shallowRef } from 'vue'
import { AdjustmentRangeMaskManager } from '../utils/lut/adjustmentRangeMask'
import { RGBColor } from '../utils/lut/colorQuantization'
import { HSLRange } from '../utils/lut/hslMask'
import { AdjustmentLayer, ColorBlockSelectorReturn } from './useColorBlockSelector.types'
import { useLayerManager } from './useLayerManager'
import { useColorBlockMask } from './useColorBlockMask'
import { useMaskPreview } from './useMaskPreview'
import { useColorBlockGenerator } from './useColorBlockGenerator'

// 重新导出类型以保持兼容性
export type { AdjustmentLayer, ColorBlockSelectorCtx, ColorBlockSelectorReturn } from './useColorBlockSelector.types'

/**
 * 色块选择相关的composable
 */
export const useColorBlockSelector = (): ColorBlockSelectorReturn => {
    // 色块选择相关状态
    const quantizedColorBlocks = ref<RGBColor[]>([])
    const commonHslBlocks = ref<HSLRange[]>([])
    const selectedColorBlocks = ref<string[]>([])
    const maskOptions = ref({ smooth: true, invert: true })
    const maskManager = shallowRef<AdjustmentRangeMaskManager | null>(null)
    const maskPreviewCanvas = ref<HTMLCanvasElement | null>(null)
    const layers = ref<AdjustmentLayer[]>([])
    const activeLayerId = ref<string | null>(null)

    // 组合子模块
    const layerManager = useLayerManager(layers, activeLayerId)
    const maskGen = useColorBlockMask(layers, maskManager, maskOptions)
    const preview = useMaskPreview(layers, maskPreviewCanvas, maskGen.generateColorBlockMask)
    const generator = useColorBlockGenerator(quantizedColorBlocks, commonHslBlocks, maskManager)

    return {
        // 状态
        quantizedColorBlocks, commonHslBlocks, selectedColorBlocks,
        maskOptions, maskManager, maskPreviewCanvas, layers, activeLayerId,
        // 方法
        ...generator, ...layerManager, ...maskGen, ...preview
    }
}

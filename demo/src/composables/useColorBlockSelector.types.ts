import { Ref } from 'vue'
import { AdjustmentRangeMaskManager } from '../utils/lut/adjustmentRangeMask'
import { RGBColor } from '../utils/lut/colorQuantization'
import { HSLRange } from '../utils/lut/hslMask'

/**
 * 调整图层接口
 */
export interface AdjustmentLayer {
    id: string
    name: string
    type: 'quantized' | 'hsl'
    visible: boolean
    intensity: number
    blendMode: 'add' | 'multiply' | 'max' | 'min'
    // Quantized color specific
    color?: RGBColor
    tolerance?: number
    // HSL specific
    hslRange?: HSLRange
}

/**
 * 遮罩选项
 */
export interface MaskOptions {
    smooth: boolean
    invert: boolean
}

/**
 * 色块选择器状态
 */
export interface ColorBlockSelectorState {
    quantizedColorBlocks: Ref<RGBColor[]>
    commonHslBlocks: Ref<HSLRange[]>
    selectedColorBlocks: Ref<string[]>
    maskOptions: Ref<MaskOptions>
    maskManager: Ref<AdjustmentRangeMaskManager | null>
    maskPreviewCanvas: Ref<HTMLCanvasElement | null>
    layers: Ref<AdjustmentLayer[]>
    activeLayerId: Ref<string | null>
}

/**
 * 色块选择器上下文接口 (兼容旧接口)
 */
export type ColorBlockSelectorCtx = ColorBlockSelectorState

/**
 * 色块选择器返回类型（结构化子模块）
 * 调用方应直接使用 states, generator, layerManager, maskGen, preview 子模块
 */
export interface ColorBlockSelectorReturn {
    states: ColorBlockSelectorState
    generator: ReturnType<typeof import('./useColorBlockGenerator').useColorBlockGenerator>
    layerManager: ReturnType<typeof import('./useLayerManager').useLayerManager>
    maskGen: ReturnType<typeof import('./useColorBlockMask').useColorBlockMask>
    preview: ReturnType<typeof import('./useMaskPreview').useMaskPreview>
}

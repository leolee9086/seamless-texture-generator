import type { Ref, DehazeParams, ClarityParams, LuminanceAdjustmentParams } from './imports'
import type { HSLAdjustmentLayer } from './useAdjustmentParams.hsl.types'

export interface AdjustmentParams {
    globalHSL: Ref<{ hue: number, saturation: number, lightness: number }>
    hslLayers: Ref<HSLAdjustmentLayer[]>
    exposureStrength: Ref<number>
    exposureManual: Ref<{ exposure: number, contrast: number, gamma: number }>
    dehazeParams: Ref<DehazeParams>
    clarityParams: Ref<ClarityParams>
    luminanceParams: Ref<LuminanceAdjustmentParams>
}
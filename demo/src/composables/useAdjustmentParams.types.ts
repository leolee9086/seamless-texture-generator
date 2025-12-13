import type { Ref, DehazeParams, ClarityParams, LuminanceAdjustmentParams } from './imports'

/**
 * HSL调整层接口
 */
export interface HSLAdjustmentLayer {
    id: string
    type: 'global' | 'selective'
    targetColor?: string  // selective模式使用
    hue: number           // -180 到 180
    saturation: number    // -100 到 100
    lightness: number     // -100 到 100
    precision?: number    // 0-100, selective模式使用
    range?: number        // 0-100, selective模式使用
}

export interface AdjustmentParams {
    globalHSL: Ref<{ hue: number, saturation: number, lightness: number }>
    hslLayers: Ref<HSLAdjustmentLayer[]>
    exposureStrength: Ref<number>
    exposureManual: Ref<{ exposure: number, contrast: number, gamma: number }>
    dehazeParams: Ref<DehazeParams>
    clarityParams: Ref<ClarityParams>
    luminanceParams: Ref<LuminanceAdjustmentParams>
}
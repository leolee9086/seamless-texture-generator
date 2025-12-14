import { ref, type Ref, type Component } from 'vue'
import type { HSLAdjustmentLayer } from '../adjustments/hsl/hslAdjustStep'
import type { DehazeParams } from '@/adjustments/dehaze/types'
import type { ClarityParams } from '../adjustments/clarityAdjustment'
import type { LuminanceAdjustmentParams } from '../adjustments/luminance'

/** 预览覆盖层数据 */
export interface PreviewOverlayData {
    data: unknown
    component: Component
}

/** useTextureState 选项 */
export interface UseTextureStateOptions {
    initialMaxResolution?: number
    initialBorderSize?: number
}

/**
 * 纹理生成器的响应式状态管理
 */
export function useTextureState(options: UseTextureStateOptions = {}) {
    const { initialMaxResolution = 4096, initialBorderSize = 0 } = options

    // 图像状态
    const originalImage = ref<string | null>(null)
    const rawOriginalImage = ref<string | null>(null)
    const processedImage = ref<string | null>(null)

    // 处理参数
    const borderSize = ref(initialBorderSize)
    const maxResolution = ref(initialMaxResolution)
    const splitPosition = ref(0.5)

    // UI 状态
    const isProcessing = ref(false)
    const isSampling = ref(false)
    const errorMessage = ref('')
    const viewerRef = ref()
    const zoomLevel = ref(1)
    const magnifierEnabled = ref(true)

    // 预览覆盖层
    const previewOverlay = ref<PreviewOverlayData | null>(null)

    return {
        originalImage,
        rawOriginalImage,
        processedImage,
        borderSize,
        maxResolution,
        splitPosition,
        isProcessing,
        isSampling,
        errorMessage,
        viewerRef,
        zoomLevel,
        magnifierEnabled,
        previewOverlay,
    }
}

/** useTextureState 返回值类型 */
export type TextureState = ReturnType<typeof useTextureState>

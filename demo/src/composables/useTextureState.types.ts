import type { Component, Ref, ComputedRef } from './imports'

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
 * 纹理状态接口
 * 
 * 定义 useTextureState 的返回值结构
 */
export interface TextureState {
    originalImage: Ref<string | null>
    rawOriginalImage: ComputedRef<string | null>
    processedImage: Ref<string | null>
    borderSize: ComputedRef<number> | Ref<number>
    maxResolution: ComputedRef<number> | Ref<number>
    splitPosition: Ref<number>
    isProcessing: Ref<boolean>
    isSampling: Ref<boolean>
    errorMessage: Ref<string>
    viewerRef: Ref<unknown>
    zoomLevel: Ref<number>
    magnifierEnabled: Ref<boolean>
    previewOverlay: Ref<PreviewOverlayData | null>
}


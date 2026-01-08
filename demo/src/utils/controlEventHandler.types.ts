import type { DehazeParams, ClarityParams, LuminanceAdjustmentParams, Component, HSLAdjustmentLayer, 水印配置 } from './imports'

/**
 * 创建统一事件处理器的配置选项
 */
export interface ControlEventHandlerOptions {
    // 按钮点击动作处理器
    onLoadSampleImage?: () => void
    onProcessImage?: () => void
    onToggleMagnifier?: () => void
    onResetZoom?: () => void
    onSaveResult?: () => void
    onSaveOriginal?: () => void
    onOpenSamplingEditor?: () => void
    onToggleCamera?: () => void
    onToggleLUT?: () => void
    onClearLUT?: () => void

    // 数据更新动作处理器
    onImageUpload?: (event: Event) => void
    onPhotoCaptured?: (imageData: string) => void
    onCameraError?: (message: string) => void
    onMaxResolution?: (value: number) => void
    onBorderSize?: (value: number) => void
    onSplitPosition?: (value: number) => void
    onZoomLevel?: (value: number) => void
    onLUTIntensity?: (value: number) => void
    onLUTFileChange?: (file: File) => void
    onMaskUpdate?: (maskGenerator: (() => Promise<Uint8Array | null>) | null) => void
    // 预览覆盖层处理器
    onSetPreviewOverlay?: (data: any, component: Component) => void
    // HSL调整处理器 - 在这里添加
    onGlobalHSLChange?: (layer: HSLAdjustmentLayer) => void
    onAddHSLLayer?: (layer: any) => void
    onUpdateHSLLayer?: (id: string, updates: any) => void
    onRemoveHSLLayer?: (id: string) => void  // 曝光调整处理器
    onExposureStrength?: (strength: number) => void
    onExposureManual?: (params: { exposure: number; contrast: number; gamma: number }) => void
    // 去雾调整处理器
    onDehazeChange?: (params: DehazeParams) => void
    // 清晰度调整处理器
    onClarityAdjustment?: (params: ClarityParams) => void
    // 亮度调整处理器
    onLuminanceAdjustment?: (params: LuminanceAdjustmentParams) => void
    // 设置图片
    onSetImage?: (imageData: string) => void
    // 水印调整处理器
    onWatermarkConfigChange?: (config: 水印配置) => void
    onWatermarkEnableChange?: (enabled: boolean) => void
}


import type { ControlEvent } from '../types/controlEvents'
import type { Component } from 'vue'

/**
 * 鍒涘缓缁熶竴浜嬩欢澶勭悊鍣ㄧ殑閰嶇疆閫夐」
 */
export interface ControlEventHandlerOptions {
  // 鎸夐挳鐐瑰嚮鍔ㄤ綔澶勭悊鍣?
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

  // 鏁版嵁鏇存柊鍔ㄤ綔澶勭悊鍣?
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
  // 棰勮瑕嗙洊灞傚鐞嗗櫒
  onSetPreviewOverlay?: (data: any, component: Component) => void
  // HSL璋冩暣澶勭悊鍣?- 鍦ㄨ繖閲屾坊鍔?
  onGlobalHSLChange?: (layer: import('./hslAdjustStep').HSLAdjustmentLayer) => void
  onAddHSLLayer?: (layer: any) => void
  onUpdateHSLLayer?: (id: string, updates: any) => void
  onRemoveHSLLayer?: (id: string) => void  // 曝光调整处理器
  onExposureStrength?: (strength: number) => void
  onExposureManual?: (params: { exposure: number; contrast: number; gamma: number }) => void
  // 去雾调整处理器
  onDehazeChange?: (params: import('./dehazeAdjustment').DehazeParams) => void
  // 清晰度调整处理器
  onClarityAdjustment?: (params: import('./clarityAdjustment').ClarityParams) => void
  // 亮度调整处理器
  onLuminanceAdjustment?: (params: import('./luminanceAdjustment').LuminanceAdjustmentParams) => void
  // 设置图片
  onSetImage?: (imageData: string) => void
}

/**
 * 创建统一的控制事件处理器
 * @param options 处理器选项
 * @returns 事件处理函数
 *
export function createControlEventHandler(options: ControlEventHandlerOptions) {
  return (event: ControlEvent) => {
    const { type, detail } = event

    if (type === 'button-click') {
      switch (detail.action) {
        case 'load-sample-image':
          options.onLoadSampleImage?.()
          break
        case 'process-image':
          options.onProcessImage?.()
          break
        case 'toggle-magnifier':
          options.onToggleMagnifier?.()
          break
        case 'reset-zoom':
          options.onResetZoom?.()
          break
        case 'save-result':
          options.onSaveResult?.()
          break
        case 'save-original':
          options.onSaveOriginal?.()
          break
        case 'open-sampling-editor':
          options.onOpenSamplingEditor?.()
          break
        case 'toggle-camera':
          options.onToggleCamera?.()
          break
        case 'toggle-lut':
          options.onToggleLUT?.()
          break
        case 'clear-lut':
          options.onClearLUT?.()
          break
      }
    } else if (type === 'update-data') {
      switch (detail.action) {
        case 'image-upload':
          options.onImageUpload?.(detail.data)
          break
        case 'photo-captured':
          options.onPhotoCaptured?.(detail.data)
          break
        case 'camera-error':
          options.onCameraError?.(detail.data)
          break
        case 'max-resolution':
          options.onMaxResolution?.(detail.data)
          break
        case 'border-size':
          options.onBorderSize?.(detail.data)
          break
        case 'split-position':
          options.onSplitPosition?.(detail.data)
          break
        case 'zoom-level':
          options.onZoomLevel?.(detail.data)
          break
        case 'lut-intensity':
          options.onLUTIntensity?.(detail.data)
          break
        case 'lut-file-change':
          options.onLUTFileChange?.(detail.data)
          break
        case 'mask-update':
          options.onMaskUpdate?.(detail.data)
          break
        case 'set-preview-overlay':
          if (detail.data && typeof detail.data === 'object' && 'data' in detail.data && 'component' in detail.data) {
            options.onSetPreviewOverlay?.(detail.data.data, detail.data.component)
          }
          break
        // HSL浜嬩欢澶勭悊 - 鍦ㄨ繖閲屾坊鍔?
        case 'global-hsl-change':
          options.onGlobalHSLChange?.(detail.data)
          break
        case 'add-hsl-layer':
          options.onAddHSLLayer?.(detail.data)
          break
        case 'update-hsl-layer':
          options.onUpdateHSLLayer?.(detail.data.id, detail.data.updates)
          break
        case 'remove-hsl-layer':
          options.onRemoveHSLLayer?.(detail.data)
          break
        case 'exposure-strength':
          options.onExposureStrength?.(detail.data)
          break
        case 'exposure-manual':
          options.onExposureManual?.(detail.data)
          break
        case 'dehaze-change':
          import type { ControlEvent } from '../types/controlEvents'
          import type { Component } from 'vue'

          /**
           * 鍒涘缓缁熶竴浜嬩欢澶勭悊鍣ㄧ殑閰嶇疆閫夐」
           */
export interface ControlEventHandlerOptions {
  // 鎸夐挳鐐瑰嚮鍔ㄤ綔澶勭悊鍣?
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

  // 鏁版嵁鏇存柊鍔ㄤ綔澶勭悊鍣?
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
  // 棰勮瑕嗙洊灞傚鐞嗗櫒
  onSetPreviewOverlay?: (data: any, component: Component) => void
  // HSL璋冩暣澶勭悊鍣?- 鍦ㄨ繖閲屾坊鍔?
  onGlobalHSLChange?: (layer: import('./hslAdjustStep').HSLAdjustmentLayer) => void
  onAddHSLLayer?: (layer: any) => void
  onUpdateHSLLayer?: (id: string, updates: any) => void
  onRemoveHSLLayer?: (id: string) => void
  // 鏇濆厜璋冩暣澶勭悊鍣?
  onExposureStrength?: (strength: number) => void
  onExposureManual?: (params: { exposure: number; contrast: number; gamma: number }) => void
  // 鍘婚浘璋冩暣澶勭悊鍣?
  onDehazeChange?: (params: import('./dehazeAdjustment').DehazeParams) => void
  // 娓呮櫚搴﹁皟鏁村鐞嗗櫒
  onClarityAdjustment?: (params: import('./clarityAdjustment').ClarityParams) => void
  // 浜害璋冩暣澶勭悊鍣?
  onLuminanceAdjustment?: (params: import('./luminanceAdjustment').LuminanceAdjustmentParams) => void
  onSetImage?: (imageData: string) => void
}

/**
 * 鍒涘缓缁熶竴鐨勪簨浠跺鐞嗗櫒鍑芥暟
 * @param options 澶勭悊鍣ㄩ厤缃?
 * @returns 浜嬩欢澶勭悊鍑芥暟
 */
export function createControlEventHandler(options: ControlEventHandlerOptions) {
  return (event: ControlEvent) => {
    const { type, detail } = event

    if (type === 'button-click') {
      switch (detail.action) {
        case 'load-sample-image':
          options.onLoadSampleImage?.()
          break
        case 'process-image':
          options.onProcessImage?.()
          break
        case 'toggle-magnifier':
          options.onToggleMagnifier?.()
          break
        case 'reset-zoom':
          options.onResetZoom?.()
          break
        case 'save-result':
          options.onSaveResult?.()
          break
        case 'save-original':
          options.onSaveOriginal?.()
          break
        case 'open-sampling-editor':
          options.onOpenSamplingEditor?.()
          break
        case 'toggle-camera':
          options.onToggleCamera?.()
          break
        case 'toggle-lut':
          options.onToggleLUT?.()
          break
        case 'clear-lut':
          options.onClearLUT?.()
          break
      }
    } else if (type === 'update-data') {
      switch (detail.action) {
        case 'image-upload':
          options.onImageUpload?.(detail.data)
          break
        case 'photo-captured':
          options.onPhotoCaptured?.(detail.data)
          break
        case 'camera-error':
          options.onCameraError?.(detail.data)
          break
        case 'max-resolution':
          options.onMaxResolution?.(detail.data)
          break
        case 'border-size':
          options.onBorderSize?.(detail.data)
          break
        case 'split-position':
          options.onSplitPosition?.(detail.data)
          break
        case 'zoom-level':
          options.onZoomLevel?.(detail.data)
          break
        case 'lut-intensity':
          options.onLUTIntensity?.(detail.data)
          break
        case 'lut-file-change':
          options.onLUTFileChange?.(detail.data)
          break
        case 'mask-update':
          options.onMaskUpdate?.(detail.data)
          break
        case 'set-preview-overlay':
          if (detail.data && typeof detail.data === 'object' && 'data' in detail.data && 'component' in detail.data) {
            options.onSetPreviewOverlay?.(detail.data.data, detail.data.component)
          }
          break
        // HSL浜嬩欢澶勭悊 - 鍦ㄨ繖閲屾坊鍔?
        case 'global-hsl-change':
          options.onGlobalHSLChange?.(detail.data)
          break
        case 'add-hsl-layer':
          options.onAddHSLLayer?.(detail.data)
          break
        case 'update-hsl-layer':
          options.onUpdateHSLLayer?.(detail.data.id, detail.data.updates)
          break
        case 'remove-hsl-layer':
          options.onRemoveHSLLayer?.(detail.data)
          break
        case 'exposure-strength':
          options.onExposureStrength?.(detail.data)
          break
        case 'exposure-manual':
          options.onExposureManual?.(detail.data)
          break
        case 'dehaze-change':
          options.onDehazeChange?.(detail.data)
          break
        case 'clarity-adjustment':
          options.onClarityAdjustment?.(detail.data)
          break
        case 'luminance-adjustment':
          options.onLuminanceAdjustment?.(detail.data)
          break
        case 'set-image':
          options.onSetImage?.(detail.data)
          break
      }
    }
  }
}
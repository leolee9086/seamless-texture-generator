import type { ControlEvent } from '../types/controlEvents'
import type { Component } from 'vue'

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
  onGlobalHSLChange?: (hsl: { hue: number; saturation: number; lightness: number }) => void
  onAddHSLLayer?: (layer: any) => void
  onUpdateHSLLayer?: (id: string, updates: any) => void
  onRemoveHSLLayer?: (id: string) => void
}

/**
 * 创建统一的事件处理器函数
 * @param options 处理器配置
 * @returns 事件处理函数
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
        // HSL事件处理 - 在这里添加
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
      }
    }
  }
}
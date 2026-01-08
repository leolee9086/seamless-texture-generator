import type { ControlEvent, ControlEventDetail } from './imports'
import type { ControlEventHandlerOptions } from './controlEventHandler.types'
import { BUTTON_ACTION, DATA_ACTION, EVENT_TYPE } from './controlEventHandler.constants'

export type { ControlEventHandlerOptions }

/** 按钮点击action到处理函数的映射 */
const buttonClickHandlers: Record<string, (options: ControlEventHandlerOptions) => void> = {
  [BUTTON_ACTION.LOAD_SAMPLE_IMAGE]: (o) => o.onLoadSampleImage?.(),
  [BUTTON_ACTION.PROCESS_IMAGE]: (o) => o.onProcessImage?.(),
  [BUTTON_ACTION.TOGGLE_MAGNIFIER]: (o) => o.onToggleMagnifier?.(),
  [BUTTON_ACTION.RESET_ZOOM]: (o) => o.onResetZoom?.(),
  [BUTTON_ACTION.SAVE_RESULT]: (o) => o.onSaveResult?.(),
  [BUTTON_ACTION.SAVE_ORIGINAL]: (o) => o.onSaveOriginal?.(),
  [BUTTON_ACTION.OPEN_SAMPLING_EDITOR]: (o) => o.onOpenSamplingEditor?.(),
  [BUTTON_ACTION.TOGGLE_CAMERA]: (o) => o.onToggleCamera?.(),
  [BUTTON_ACTION.TOGGLE_LUT]: (o) => o.onToggleLUT?.(),
  [BUTTON_ACTION.CLEAR_LUT]: (o) => o.onClearLUT?.(),
}

/** 处理按钮点击事件 */
function handleButtonClick(options: ControlEventHandlerOptions, action: string): void {
  buttonClickHandlers[action]?.(options)
}

/** 处理数据更新事件 - 使用早返回模式保持类型安全 */
function handleUpdateData(options: ControlEventHandlerOptions, detail: ControlEventDetail): void {
  const { action, data } = detail

  if (action === DATA_ACTION.IMAGE_UPLOAD) { options.onImageUpload?.(data); return }
  if (action === DATA_ACTION.PHOTO_CAPTURED) { options.onPhotoCaptured?.(data); return }
  if (action === DATA_ACTION.CAMERA_ERROR) { options.onCameraError?.(data); return }
  if (action === DATA_ACTION.MAX_RESOLUTION) { options.onMaxResolution?.(data); return }
  if (action === DATA_ACTION.BORDER_SIZE) { options.onBorderSize?.(data); return }
  if (action === DATA_ACTION.SPLIT_POSITION) { options.onSplitPosition?.(data); return }
  if (action === DATA_ACTION.ZOOM_LEVEL) { options.onZoomLevel?.(data); return }
  if (action === DATA_ACTION.LUT_INTENSITY) { options.onLUTIntensity?.(data); return }
  if (action === DATA_ACTION.LUT_FILE_CHANGE) { options.onLUTFileChange?.(data); return }
  if (action === DATA_ACTION.MASK_UPDATE) { options.onMaskUpdate?.(data); return }
  if (action === DATA_ACTION.SET_PREVIEW_OVERLAY && data && typeof data === 'object' && 'data' in data && 'component' in data) {
    options.onSetPreviewOverlay?.(data.data, data.component)
    return
  }
  if (action === DATA_ACTION.SET_PREVIEW_OVERLAY) { return }
  if (action === DATA_ACTION.GLOBAL_HSL_CHANGE) { options.onGlobalHSLChange?.(data); return }
  if (action === DATA_ACTION.ADD_HSL_LAYER) { options.onAddHSLLayer?.(data); return }
  if (action === DATA_ACTION.UPDATE_HSL_LAYER) { options.onUpdateHSLLayer?.(data.id, data.updates); return }
  if (action === DATA_ACTION.REMOVE_HSL_LAYER) { options.onRemoveHSLLayer?.(data); return }
  if (action === DATA_ACTION.EXPOSURE_STRENGTH) { options.onExposureStrength?.(data); return }
  if (action === DATA_ACTION.EXPOSURE_MANUAL) { options.onExposureManual?.(data); return }
  if (action === DATA_ACTION.DEHAZE_CHANGE) { options.onDehazeChange?.(data); return }
  if (action === DATA_ACTION.CLARITY_ADJUSTMENT) { options.onClarityAdjustment?.(data); return }
  if (action === DATA_ACTION.LUMINANCE_ADJUSTMENT) { options.onLuminanceAdjustment?.(data); return }
  if (action === DATA_ACTION.SET_IMAGE) { options.onSetImage?.(data); return }
  if (action === DATA_ACTION.WATERMARK_CONFIG_CHANGE) { options.onWatermarkConfigChange?.(data); return }
  if (action === DATA_ACTION.WATERMARK_ENABLE_CHANGE) { options.onWatermarkEnableChange?.(data); return }
}

/**
 * 创建统一的事件处理器函数
 * @param options 处理器配置
 * @returns 事件处理函数
 */
export function createControlEventHandler(options: ControlEventHandlerOptions) {
  return (event: ControlEvent): void => {
    const { type, detail } = event
    if (type === EVENT_TYPE.BUTTON_CLICK) {
      handleButtonClick(options, detail.action)
      return
    }
    if (type === EVENT_TYPE.UPDATE_DATA) {
      handleUpdateData(options, detail)
    }
  }
}
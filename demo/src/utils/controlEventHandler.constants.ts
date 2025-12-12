/**
 * controlEventHandler 事件 Action 常量定义
 * 将 Magic String 提取到此处统一管理
 */

/** 按钮点击 Action 常量 */
export const BUTTON_ACTION = {
    LOAD_SAMPLE_IMAGE: 'load-sample-image',
    PROCESS_IMAGE: 'process-image',
    TOGGLE_MAGNIFIER: 'toggle-magnifier',
    RESET_ZOOM: 'reset-zoom',
    SAVE_RESULT: 'save-result',
    SAVE_ORIGINAL: 'save-original',
    OPEN_SAMPLING_EDITOR: 'open-sampling-editor',
    TOGGLE_CAMERA: 'toggle-camera',
    TOGGLE_LUT: 'toggle-lut',
    CLEAR_LUT: 'clear-lut',
} as const

/** 数据更新 Action 常量 */
export const DATA_ACTION = {
    IMAGE_UPLOAD: 'image-upload',
    PHOTO_CAPTURED: 'photo-captured',
    CAMERA_ERROR: 'camera-error',
    MAX_RESOLUTION: 'max-resolution',
    BORDER_SIZE: 'border-size',
    SPLIT_POSITION: 'split-position',
    ZOOM_LEVEL: 'zoom-level',
    LUT_INTENSITY: 'lut-intensity',
    LUT_FILE_CHANGE: 'lut-file-change',
    MASK_UPDATE: 'mask-update',
    SET_PREVIEW_OVERLAY: 'set-preview-overlay',
    GLOBAL_HSL_CHANGE: 'global-hsl-change',
    ADD_HSL_LAYER: 'add-hsl-layer',
    UPDATE_HSL_LAYER: 'update-hsl-layer',
    REMOVE_HSL_LAYER: 'remove-hsl-layer',
    EXPOSURE_STRENGTH: 'exposure-strength',
    EXPOSURE_MANUAL: 'exposure-manual',
    DEHAZE_CHANGE: 'dehaze-change',
    CLARITY_ADJUSTMENT: 'clarity-adjustment',
    LUMINANCE_ADJUSTMENT: 'luminance-adjustment',
    SET_IMAGE: 'set-image',
} as const

/** 事件类型常量 */
export const EVENT_TYPE = {
    BUTTON_CLICK: 'button-click',
    UPDATE_DATA: 'update-data',
} as const

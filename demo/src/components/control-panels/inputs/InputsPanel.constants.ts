/**
 * InputsPanel 相关常量定义
 */

// 选项卡常量
export const INPUTS_PANEL_TABS = {
  UPLOAD: 'Upload',
  PROCEDURAL: 'Procedural',
  TEXT_TO_IMAGE: 'Text-to-Image'
} as const

export type InputsPanelTab = typeof INPUTS_PANEL_TABS[keyof typeof INPUTS_PANEL_TABS]

// 事件名称常量
export const INPUTS_PANEL_EVENTS = {
  LOAD_SAMPLE: 'load-sample',
  IMAGE_UPLOAD: 'image-upload',
  SLIDER_UPDATE: 'slider-update',
  SET_IMAGE: 'set-image'
} as const

// 验证错误消息常量
export const INPUTS_PANEL_VALIDATION_ERRORS = {
  IS_PROCESSING_BOOLEAN: 'isProcessing must be a boolean',
  ORIGINAL_IMAGE_STRING_OR_NULL: 'originalImage must be a string or null',
  INPUT_SLIDER_ITEMS_ARRAY: 'inputSliderItems must be an array'
} as const

// 默认值常量
export const INPUTS_PANEL_DEFAULTS = {
  IS_MOBILE: false
} as const

// 类型常量
export const INPUTS_PANEL_TYPES = {
  BOOLEAN: 'boolean',
  STRING: 'string',
  ARRAY: 'array'
} as const
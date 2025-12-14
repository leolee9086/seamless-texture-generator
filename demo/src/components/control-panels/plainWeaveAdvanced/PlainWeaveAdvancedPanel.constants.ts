/**
 * PlainWeavePanel 相关常量定义
 */

// 事件名称常量
export const PLAIN_WEAVE_PANEL_EVENTS = {
  SET_IMAGE: 'set-image',
  UPDATE_VALUE: 'update-value',
  APPLY_PRESET: 'apply-preset'
} as const

// 验证错误消息常量
export const PLAIN_WEAVE_PANEL_VALIDATION_ERRORS = {
  IS_GENERATING_BOOLEAN: 'isGenerating must be a boolean',
  INVALID_SLIDER_UPDATE: 'Parameter should not be updated via number slider',
  INVALID_IMAGE_DATA: 'Invalid image data for set-image event',
  NO_IMAGE_DATA: 'No image data provided for set-image event'
} as const

// 错误消息模板函数
export const PLAIN_WEAVE_PANEL_ERROR_TEMPLATES = {
  INVALID_IMAGE_DATA_WITH_REASON: (reason: string) => `Invalid image data for set-image event: ${reason}`
} as const

// 默认值常量
export const PLAIN_WEAVE_PANEL_DEFAULTS = {
  TILE_SIZE: 1.0,
  WARP_DENSITY: 30.0,
  WEFT_DENSITY: 30.0,
  WARP_COLOR: '#e8e8e8',
  WEFT_COLOR: '#d4d4d4',
  BACKGROUND_COLOR: '#000000',
  BACKGROUND_OPACITY: 1.0,
  THREAD_THICKNESS: 0.45,
  THREAD_TWIST: 0.5,
  FIBER_DETAIL: 0.3,
  FUZZINESS: 0.2,
  WEAVE_TIGHTNESS: 0.7,
  THREAD_UNEVENNESS: 0.15,
  WEAVE_IMPERFECTION: 0.1,
  FBM_OCTAVES: 3,
  FBM_AMPLITUDE: 0.5,
  NOISE_FREQUENCY: 5.0,
  COLOR_VARIATION: 0.05,
  THREAD_HEIGHT_SCALE: 1.0,
  THREAD_SHADOW_STRENGTH: 0.5,
  WARP_SHEEN: 0.3,
  WEFT_SHEEN: 0.25,
  NORMAL_STRENGTH: 10.0,
  ROUGHNESS_MIN: 0.5,
  ROUGHNESS_MAX: 0.8
} as const

// 类型常量
export const PLAIN_WEAVE_PANEL_TYPES = {
  BOOLEAN: 'boolean',
  NUMBER: 'number',
  STRING: 'string',
  ARRAY: 'array'
} as const

// 面板键常量
export const PLAIN_WEAVE_PANEL_KEYS = {
  SHOW_COLORS: 'showColors',
  SHOW_BASIC_PARAMS: 'showBasicParams',
  SHOW_THREAD_PARAMS: 'showThreadParams',
  SHOW_ADVANCED_PARAMS: 'showAdvancedParams',
  SHOW_MATERIAL_PARAMS: 'showMaterialParams',
  SHOW_PRESETS: 'showPresets'
} as const

// 滑块ID常量
export const SLIDER_IDS = {
  TILE_SIZE: 'tileSize',
  WARP_DENSITY: 'warpDensity',
  WEFT_DENSITY: 'weftDensity',
  BACKGROUND_OPACITY: 'backgroundOpacity',
  THREAD_THICKNESS: 'threadThickness',
  THREAD_TWIST: 'threadTwist',
  FIBER_DETAIL: 'fiberDetail',
  FUZZINESS: 'fuzziness',
  WEAVE_TIGHTNESS: 'weaveTightness',
  THREAD_UNEVENNESS: 'threadUnevenness',
  WEAVE_IMPERFECTION: 'weaveImperfection',
  FBM_OCTAVES: 'fbmOctaves',
  FBM_AMPLITUDE: 'fbmAmplitude',
  NOISE_FREQUENCY: 'noiseFrequency',
  COLOR_VARIATION: 'colorVariation',
  THREAD_HEIGHT_SCALE: 'threadHeightScale',
  THREAD_SHADOW_STRENGTH: 'threadShadowStrength',
  WARP_SHEEN: 'warpSheen',
  WEFT_SHEEN: 'weftSheen',
  NORMAL_STRENGTH: 'normalStrength',
  ROUGHNESS_MIN: 'roughnessMin',
  ROUGHNESS_MAX: 'roughnessMax'
} as const

// 滑块标签常量
export const SLIDER_LABELS = {
  TILE_SIZE: 'Tile Size',
  WARP_DENSITY: 'Warp Density',
  WEFT_DENSITY: 'Weft Density',
  BACKGROUND_OPACITY: 'Background Opacity',
  THREAD_THICKNESS: 'Thread Thickness',
  THREAD_TWIST: 'Thread Twist',
  FIBER_DETAIL: 'Fiber Detail',
  FUZZINESS: 'Fuzziness',
  WEAVE_TIGHTNESS: 'Weave Tightness',
  THREAD_UNEVENNESS: 'Thread Unevenness',
  WEAVE_IMPERFECTION: 'Weave Imperfection',
  FBM_OCTAVES: 'FBM Octaves',
  FBM_AMPLITUDE: 'FBM Amplitude',
  NOISE_FREQUENCY: 'Noise Frequency',
  COLOR_VARIATION: 'Color Variation',
  THREAD_HEIGHT_SCALE: 'Thread Height Scale',
  THREAD_SHADOW_STRENGTH: 'Thread Shadow',
  WARP_SHEEN: 'Warp Sheen',
  WEFT_SHEEN: 'Weft Sheen',
  NORMAL_STRENGTH: 'Normal Strength',
  ROUGHNESS_MIN: 'Min Roughness',
  ROUGHNESS_MAX: 'Max Roughness'
} as const

// 面板标题常量
export const PANEL_TITLES = {
  BASIC_PARAMETERS: 'Basic Parameters',
  THREAD_STRUCTURE: 'Thread Structure',
  ADVANCED_PARAMETERS: 'Advanced Parameters',
  MATERIAL_PROPERTIES: 'Material Properties'
} as const

// 值位置常量
export const VALUE_POSITION = {
  AFTER: 'after'
} as const

// 防抖延迟常量（毫秒）
export const DEBOUNCE_DELAY = 50

// 生成纹理尺寸常量
export const TEXTURE_SIZE = {
  WIDTH: 1024,
  HEIGHT: 1024
} as const

// 滑块范围常量
export const SLIDER_RANGES = {
  TILE_SIZE: { MIN: 0.1, MAX: 5.0 },
  WARP_DENSITY: { MIN: 10, MAX: 150 },
  WEFT_DENSITY: { MIN: 10, MAX: 150 },
  BACKGROUND_OPACITY: { MIN: 0.0, MAX: 1.0 },
  THREAD_THICKNESS: { MIN: 0.1, MAX: 1.0 },
  THREAD_TWIST: { MIN: 0.0, MAX: 1.0 },
  FIBER_DETAIL: { MIN: 0.0, MAX: 1.0 },
  FUZZINESS: { MIN: 0.0, MAX: 1.0 },
  WEAVE_TIGHTNESS: { MIN: 0.0, MAX: 1.0 },
  THREAD_UNEVENNESS: { MIN: 0.0, MAX: 1.0 },
  WEAVE_IMPERFECTION: { MIN: 0.0, MAX: 0.5 },
  FBM_OCTAVES: { MIN: 1, MAX: 8 },
  FBM_AMPLITUDE: { MIN: 0.0, MAX: 1.0 },
  NOISE_FREQUENCY: { MIN: 1.0, MAX: 20.0 },
  COLOR_VARIATION: { MIN: 0.0, MAX: 0.5 },
  THREAD_HEIGHT_SCALE: { MIN: 0.0, MAX: 2.0 },
  THREAD_SHADOW_STRENGTH: { MIN: 0.0, MAX: 1.0 },
  WARP_SHEEN: { MIN: 0.0, MAX: 1.0 },
  WEFT_SHEEN: { MIN: 0.0, MAX: 1.0 },
  NORMAL_STRENGTH: { MIN: 0.0, MAX: 20.0 },
  ROUGHNESS_MIN: { MIN: 0.0, MAX: 1.0 },
  ROUGHNESS_MAX: { MIN: 0.0, MAX: 1.0 }
} as const

// 滑块步长常量
export const SLIDER_STEPS = {
  DEFAULT: 0.01,
  INTEGER: 1,
  DENSITY: 1
} as const
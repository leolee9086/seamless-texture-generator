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
  INVALID_SLIDER_UPDATE: 'Parameter should not be updated via number slider'
} as const

// 默认值常量
export const PLAIN_WEAVE_PANEL_DEFAULTS = {
  TILE_SIZE: 1.0,
  THREAD_DENSITY: 20.0,
  THREAD_THICKNESS: 0.45,
  WARP_WEFT_RATIO: 1.0,
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
  THREAD_DENSITY: 'threadDensity',
  THREAD_THICKNESS: 'threadThickness',
  WARP_WEFT_RATIO: 'warpWeftRatio',
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
  THREAD_DENSITY: 'Thread Density',
  THREAD_THICKNESS: 'Thread Thickness',
  WARP_WEFT_RATIO: 'Warp/Weft Ratio',
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
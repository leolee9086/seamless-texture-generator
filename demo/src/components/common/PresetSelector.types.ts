/**
 * 预设数据类型定义
 */
export type PresetData = Record<string, unknown>

/**
 * PresetSelector 组件的 Props 类型定义
 */
export interface PresetSelectorProps {
  /** 预设配置对象 */
  presets: Record<string, PresetData>
}

/**
 * PresetSelector 组件的 Emits 类型定义
 */
export interface PresetSelectorEmits {
  /** 应用预设 */
  'apply-preset': [preset: PresetData]
}
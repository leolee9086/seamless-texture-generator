/**
 * 可折叠面板组件的 Props 类型定义
 */
export interface CollapsiblePanelProps {
  title: string
  modelValue?: boolean
}

/**
 * 生成按钮组件的 Props 类型定义
 */
export interface GenerateButtonProps {
  isGenerating: boolean
  disabled?: boolean
  buttonText?: string
  generatingText?: string
}

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
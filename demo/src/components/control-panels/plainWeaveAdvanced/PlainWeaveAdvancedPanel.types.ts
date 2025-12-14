import type { SliderItem } from './imports'



/**
 * 滑块配置参数接口
 */
export interface SliderConfig {
  id: string
  label: string
  value: number
  min: number
  max: number
  step: number
}

/**
 * 平纹织物参数类型定义
 */
import type { PlainWeaveAdvancedParams } from './imports'

/**
 * 平纹织物参数类型定义 (Alias)
 */
export type PlainWeaveParams = PlainWeaveAdvancedParams
export type { PlainWeaveAdvancedParams }

/**
 * 预设类型定义
 */
export type WeavePreset = Partial<PlainWeaveParams>

/**
 * 滑块面板配置类型
 */
export interface SliderPanelConfig {
  /** 面板标题 */
  title: string
  /** 模型键 */
  modelKey: string
  /** 滑块项目 */
  items: SliderItem[]
}

/**
 * 防抖生成函数返回类型 - 行为
 */
export interface DebouncedGenerateResultActions {
  generate: () => Promise<void>
  debouncedGenerate: () => void
}

/**
 * 防抖生成函数返回类型
 */
export interface DebouncedGenerateResult {
  state: {
    localIsGenerating: { value: boolean }
  }
  actions: DebouncedGenerateResultActions
}

/**
 * 平纹织物面板组合式函数返回类型 - 状态
 */
export interface UsePlainWeavePanelReturnState {
  /** 状态 */
  plainWeaveParams: PlainWeaveParams
  /** 本地生成状态 */
  localIsGenerating: { value: boolean }
  /** 预设配置 */
  weavePresets: Record<string, WeavePreset>
}

/**
 * 平纹织物面板组合式函数返回类型 - 行为
 */
export interface UsePlainWeavePanelReturnActions {
  /** 处理参数更新 */
  handleParamUpdate: (data: { id: string; value: number }) => void
  /** 应用预设 */
  handleApplyPreset: (preset: WeavePreset) => void
  /** 生成纹理 */
  generate: () => Promise<void>
  /** 防抖生成纹理 */
  debouncedGenerate: () => void
}

/**
 * 平纹织物面板组合式函数返回类型
 */
export interface UsePlainWeavePanelReturn {
  state: UsePlainWeavePanelReturnState
  actions: UsePlainWeavePanelReturnActions
}
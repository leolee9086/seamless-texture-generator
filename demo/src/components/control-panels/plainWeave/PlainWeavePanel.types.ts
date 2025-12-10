import type { SliderItem } from './imports'

/**
 * PlainWeavePanel 组件的 Props 类型定义
 */
export interface PlainWeavePanelProps {
  /** 是否正在生成 */
  isGenerating: boolean
}

/**
 * PlainWeavePanel 组件的 Emits 类型定义
 */
export interface PlainWeavePanelEmits {
  /** 设置图片 */
  'set-image': [imageData: string]
}

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
export interface PlainWeaveParams {
  /** 瓦片大小 */
  tileSize: number
  /** 线密度 */
  threadDensity: number
  /** 线厚度 */
  threadThickness: number
  /** 经纬比 */
  warpWeftRatio: number
  /** 线捻度 */
  threadTwist: number
  /** 纤维细节 */
  fiberDetail: number
  /** 毛茸程度 */
  fuzziness: number
  /** 织物紧密度 */
  weaveTightness: number
  /** 线不均匀度 */
  threadUnevenness: number
  /** 织物不完美度 */
  weaveImperfection: number
  /** FBM 八度 */
  fbmOctaves: number
  /** FBM 振幅 */
  fbmAmplitude: number
  /** 噪声频率 */
  noiseFrequency: number
  /** 颜色变化 */
  colorVariation: number
  /** 线高度缩放 */
  threadHeightScale: number
  /** 线阴影强度 */
  threadShadowStrength: number
  /** 经线光泽 */
  warpSheen: number
  /** 纬线光泽 */
  weftSheen: number
  /** 法线强度 */
  normalStrength: number
  /** 最小粗糙度 */
  roughnessMin: number
  /** 最大粗糙度 */
  roughnessMax: number
  /** 渐变停止点 */
  gradientStops: Array<{ offset: number; color: string }>
}

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
 * 防抖生成函数返回类型
 */
export interface DebouncedGenerateResult {
  generate: () => Promise<void>
  debouncedGenerate: () => void
  localIsGenerating: { value: boolean }
}

/**
 * PlainWeavePanel 组件的完整类型定义
 */
export type PlainWeavePanelComponent = {
  props: PlainWeavePanelProps
  emits: PlainWeavePanelEmits
}

/**
 * 平纹织物面板组合式函数返回类型
 */
export interface UsePlainWeavePanelReturn {
  /** 状态 */
  state: { plainWeaveParams: PlainWeaveParams }
  /** 本地生成状态 */
  localIsGenerating: { value: boolean }
  /** 预设配置 */
  weavePresets: Record<string, WeavePreset>
  /** 处理参数更新 */
  handleParamUpdate: (data: { id: string; value: number }) => void
  /** 应用预设 */
  handleApplyPreset: (preset: WeavePreset) => void
  /** 生成纹理 */
  generate: () => Promise<void>
}
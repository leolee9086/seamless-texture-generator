import type { SliderItem } from './imports'

/**
 * InputsPanel 组件的 Props 类型定义
 */
export interface InputsPanelProps {
  /** 是否为移动端 */
  isMobile?: boolean
  /** 是否正在处理 */
  isProcessing: boolean
  /** 原始图片 */
  originalImage: string | null
  /** 输入滑块项目 */
  inputSliderItems: SliderItem[]
}

/**
 * InputsPanel 组件的 Emits 类型定义
 */
export interface InputsPanelEmits {
  /** 加载示例图片 */
  'load-sample': []
  /** 图片上传 */
  'image-upload': [event: Event]
  /** 滑块更新 */
  'slider-update': [data: { id: string; value: number }]
  /** 设置图片 */
  'set-image': [imageData: string]
}

/**
 * TabSelector 组件的 Props 类型定义
 */
export interface TabSelectorProps {
  /** 当前活动标签 */
  activeTab: 'Upload' | 'Procedural'
  /** 标签列表 */
  tabs: readonly ['Upload', 'Procedural']
}

/**
 * TabSelector 组件的 Emits 类型定义
 */
export interface TabSelectorEmits {
  /** 标签切换 */
  'tab-change': [tab: 'Upload' | 'Procedural']
}

/**
 * UploadTabContent 组件的 Props 类型定义
 */
export interface UploadTabContentProps {
  /** 是否为移动端 */
  isMobile?: boolean
  /** 是否正在处理 */
  isProcessing: boolean
  /** 原始图片 */
  originalImage: string | null
}

/**
 * UploadTabContent 组件的 Emits 类型定义
 */
export interface UploadTabContentEmits {
  /** 加载示例图片 */
  'load-sample': []
  /** 图片上传 */
  'image-upload': [event: Event]
}

/**
 * TextureTypeSelector 组件的 Props 类型定义
 */
export interface TextureTypeSelectorProps {
  /** 当前活动类型 */
  activeType: string
  /** 纹理类型列表 */
  textureTypes: readonly string[]
}

/**
 * TextureTypeSelector 组件的 Emits 类型定义
 */
export interface TextureTypeSelectorEmits {
  /** 类型切换 */
  'type-change': [type: string]
}

/**
 * ProceduralPanelRenderer 组件的 Props 类型定义
 */
export interface ProceduralPanelRendererProps {
  /** 程序化类型 */
  proceduralType: string
  /** 是否正在生成 */
  isGenerating: boolean
}

/**
 * ProceduralPanelRenderer 组件的 Emits 类型定义
 */
export interface ProceduralPanelRendererEmits {
  /** 设置图片 */
  'set-image': [imageData: string]
}

/**
 * ProceduralTabContent 组件的 Props 类型定义
 */
export interface ProceduralTabContentProps {
  /** 是否为移动端 */
  isMobile?: boolean
  /** 程序化类型 */
  proceduralType: string
  /** 纹理类型列表 */
  textureTypes: readonly string[]
  /** 是否正在生成 */
  isGenerating: boolean
}

/**
 * ProceduralTabContent 组件的 Emits 类型定义
 */
export interface ProceduralTabContentEmits {
  /** 类型切换 */
  'type-change': [type: string]
  /** 设置图片 */
  'set-image': [imageData: string]
}

/**
 * MaxResolutionSlider 组件的 Props 类型定义
 */
export interface MaxResolutionSliderProps {
  /** 是否为移动端 */
  isMobile?: boolean
  /** 原始图片 */
  originalImage: string | null
  /** 输入滑块项目 */
  inputSliderItems: SliderItem[]
}

/**
 * MaxResolutionSlider 组件的 Emits 类型定义
 */
export interface MaxResolutionSliderEmits {
  /** 滑块更新 */
  'slider-update': [data: { id: string; value: number }]
}

/**
 * InputsPanel 组件的完整类型定义
 */
export type InputsPanelComponent = {
  props: InputsPanelProps
  emits: InputsPanelEmits
}
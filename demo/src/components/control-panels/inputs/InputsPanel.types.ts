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
 * InputsPanel 组件的完整类型定义
 */
export type InputsPanelComponent = {
  props: InputsPanelProps
  emits: InputsPanelEmits
}
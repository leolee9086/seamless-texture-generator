/**
 * 文本生成图像相关类型定义
 */

import type { Ref, TaskStatusResponse } from './imports'

export interface TextToImageParams {
  apiKey: string
  prompt: string
  size: string
  n: number
  numInferenceSteps: number
  model: string
  proxyUrl?: string
}

export interface TextToImageResult {
  success: boolean
  imageUrls?: string[]
  error?: string
}

/**
 * 处理单个任务结果的参数
 */
export interface ProcessTaskResultParams {
  result: TaskStatusResponse
  taskId: string
  imageUrls: string[]
  errors: string[]
}

/**
 * 图像画廊组件的参数
 */
export interface ImageGalleryProps {
  imageUrls: string[]
  onImageClick?: (imageUrl: string) => void
}

export interface TextToImageState {
  apiKey: string
  prompt: string
  size: string
  n: number
  numInferenceSteps: number
  model: string
  proxyUrl?: string
  showAdvanced: boolean
  isGenerating: boolean
  error: string
  status: string
}

export interface TextToImageContext {
  state: TextToImageState
  apiKeyValid: boolean
}

export type UseTextToImageStateReturn = {
  apiKey: Ref<string>
  prompt: Ref<string>
  size: Ref<string>
  n: Ref<number>
  numInferenceSteps: Ref<number>
  model: Ref<string>
  proxyUrl: Ref<string>
  showAdvanced: Ref<boolean>
  isGenerating: Ref<boolean>
  error: Ref<string>
  status: Ref<string>
  generatedImages: Ref<string[]>
  apiKeyValid: Ref<boolean>
}

export type UseTextToImageReturn = {
  apiKey: Ref<string>
  prompt: Ref<string>
  size: Ref<string>
  n: Ref<number>
  numInferenceSteps: Ref<number>
  model: Ref<string>
  proxyUrl: Ref<string>
  showAdvanced: Ref<boolean>
  isGenerating: Ref<boolean>
  error: Ref<string>
  status: Ref<string>
  generatedImages: Ref<string[]>
  apiKeyValid: Ref<boolean>
  generate: () => Promise<void>
  reset: () => void
}
/**
 * Viewer 组件类型定义
 */

import type { ComputedRef } from './imports'

/**
 * Viewer图像源
 */
export interface ViewerImageSource {
  /** 原始图像（左侧显示） */
  originalImage: ComputedRef<string | null>
  /** 处理后图像（右侧显示） */
  processedImage: ComputedRef<string | null>
}

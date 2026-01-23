/**
 * Viewer 组件上下文逻辑
 *
 * 处理画布模式输出与Viewer组件的集成
 */

import { computed } from './imports'
import type { Ref } from './imports'
import { useCanvasModeManager, CANVAS_MODE_IDS } from './imports'
import type { ViewerImageSource } from './Viewer.types'
import { isString } from './Viewer.guard'

/**
 * 从画布输出获取显示图像
 *
 * @param canvasModeManager - 画布模式管理器
 * @returns 显示图像或null
 */
function 获取画布输出图像(
  canvasModeManager: ReturnType<typeof useCanvasModeManager>
): string | null {
  const output = canvasModeManager.canvasOutput.value
  const displayImage = output.displayImage
  
  // 卫语句：确保是字符串类型
  if (!isString(displayImage)) {
    return null
  }
  
  return displayImage
}

/**
 * 创建Viewer图像源
 *
 * 根据当前画布模式提供正确的图像源
 *
 * @param fallbackOriginal - 备用原始图像（用于项目模式）
 * @param fallbackProcessed - 备用处理后图像（用于项目模式）
 * @returns Viewer图像源
 */
export function createViewerImageSource(
  fallbackOriginal: Ref<string | null>,
  fallbackProcessed: Ref<string | null>
): ViewerImageSource {
  const canvasModeManager = useCanvasModeManager()
  
  /**
   * 获取原始图像
   *
   * - 项目模式：使用fallback原始图像
   * - 程序化模式：使用画布输出
   */
  const originalImage = computed(() => {
    const currentMode = canvasModeManager.activeModeId.value
    
    // 卫语句：如果是程序化模式，使用画布输出
    if (currentMode === CANVAS_MODE_IDS.PROCEDURAL) {
      return 获取画布输出图像(canvasModeManager)
    }
    
    // 默认使用fallback原始图像（项目模式）
    return fallbackOriginal.value
  })
  
  /**
   * 获取处理后图像
   *
   * - 项目模式：使用fallback处理后图像
   * - 程序化模式：使用画布输出（与原始图像相同）
   */
  const processedImage = computed(() => {
    const currentMode = canvasModeManager.activeModeId.value
    
    // 卫语句：如果是程序化模式，使用画布输出
    if (currentMode === CANVAS_MODE_IDS.PROCEDURAL) {
      return 获取画布输出图像(canvasModeManager)
    }
    
    // 默认使用fallback处理后图像（项目模式）
    return fallbackProcessed.value
  })
  
  return {
    originalImage,
    processedImage
  }
}

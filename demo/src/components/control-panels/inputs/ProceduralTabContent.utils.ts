/**
 * ProceduralTabContent 工具函数
 * 
 * 处理程序化纹理图像更新到画布模式
 */

import { CANVAS_MODE_IDS } from './imports'
import type { useCanvasModeManager } from './imports'
import { isProceduralModeInstance } from './ProceduralTabContent.guard'

/**
 * 处理程序化纹理图像更新
 * 
 * 将生成的图像更新到程序化模式，而不是创建新项目
 * 
 * @param imageData - 生成的图像数据（DataURL）
 * @param canvasModeManager - 画布模式管理器
 */
export function 处理程序化纹理图像更新(
  imageData: string,
  canvasModeManager: ReturnType<typeof useCanvasModeManager>
): void {
  // 卫语句：确保当前是程序化模式
  if (canvasModeManager.activeModeId.value !== CANVAS_MODE_IDS.PROCEDURAL) {
    console.warn('当前不是程序化模式，无法更新程序化纹理图像')
    return
  }
  
  // 卫语句：确保当前模式实例存在
  const currentMode = canvasModeManager.activeMode.value
  if (!currentMode) {
    console.warn('当前模式实例不存在')
    return
  }
  
  // 卫语句：确保是程序化模式实例（使用类型守卫）
  if (!isProceduralModeInstance(currentMode)) {
    console.warn('当前模式不是程序化模式实例')
    return
  }
  
  // 更新程序化模式的纹理
  currentMode.setCurrentTexture(imageData)
}

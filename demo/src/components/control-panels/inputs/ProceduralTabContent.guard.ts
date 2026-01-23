/**
 * ProceduralTabContent 类型守卫
 */

import type { CanvasMode, ProceduralModeInstance } from './imports'

/**
 * 检查是否为程序化模式实例
 * 
 * @param mode - 画布模式实例
 * @returns 是否为程序化模式实例
 */
export function isProceduralModeInstance(
  mode: CanvasMode
): mode is ProceduralModeInstance {
  return 'setCurrentTexture' in mode && typeof mode.setCurrentTexture === 'function'
}

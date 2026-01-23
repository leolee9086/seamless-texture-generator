/**
 * useTextureGenerator - 类型守卫
 */

import type { CanvasMode } from './canvas-mode/types'
import type { ProjectModeInstance } from './canvas-mode/modes/projectMode/types'

/**
 * 检查是否为项目模式实例
 * @简洁函数 类型守卫谓词函数
 */
export function isProjectModeInstance(mode: CanvasMode): mode is ProjectModeInstance {
    return mode.id === 'project' && 'setProcessedImage' in mode
}

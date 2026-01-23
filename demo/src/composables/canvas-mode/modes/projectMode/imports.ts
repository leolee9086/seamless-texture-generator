/**
 * 项目模式 - 导入转发
 */

// 从父级目录导入
import { ref, watch } from '../../imports'
import type { CanvasMode, CanvasOutput } from '../../types'
import { CANVAS_MODE_IDS } from '../../constants'
import { MODE_DISPLAY_NAMES } from '../constants'

// 导入项目状态管理
import { useProjectState } from '../../../project-state/index'

export { ref, watch }
export type { CanvasMode, CanvasOutput }
export { CANVAS_MODE_IDS, MODE_DISPLAY_NAMES, useProjectState }

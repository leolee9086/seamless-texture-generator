/**
 * 项目状态管理
 *
 * 从 project-state 模块转发导出
 */

import { useProjectState } from './project-state/index'
import type { ProjectState, ProjectStateReturn } from './project-state/useProjectState.types'

export { useProjectState }
export type { ProjectState, ProjectStateReturn }

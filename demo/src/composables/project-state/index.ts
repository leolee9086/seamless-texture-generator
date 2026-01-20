/**
 * 项目状态管理模块
 *
 * 提供多图片项目的响应式状态管理。
 * 采用 ECS 风格设计：state (数据) 和 actions (行为) 分离。
 */

// 导入状态
import {
    projects,
    activeProjectId,
    activeProject,
    activeOriginalBlob,
    activeOriginalDataUrl,
    projectCount,
    hasProjects,
    isLoading,
    isSaving,
    isInitialized
} from './useProjectState.state'

// 导入操作
import {
    加载所有项目,
    创建项目,
    批量创建项目,
    切换项目,
    更新项目参数,
    立即保存当前项目,
    删除项目,
    清空所有项目
} from './useProjectState.actions'

// 导入批量操作
import {
    复制参数到项目,
    应用参数到上方项目,
    应用参数到下方项目,
    应用参数到所有项目
} from './useProjectState.batch'

// 导入类型
import type { ProjectStateReturn, ProjectStateData, ProjectStateActions } from './useProjectState.types'

// 重新导出类型
export type {
    ProjectStateReturn,
    ProjectStateData,
    ProjectStateActions,
    ProjectState
} from './useProjectState.types'

/**
 * 项目状态管理 Composable
 *
 * 返回 ECS 风格的状态和操作对象：
 * - state: 只读的响应式状态数据
 * - actions: 操作状态的方法
 *
 * @example
 * const { state, actions } = useProjectState()
 * // 读取状态
 * console.log(state.projects.value)
 * // 执行操作
 * await actions.创建项目(file)
 */
export function useProjectState(): ProjectStateReturn {
    // 自动初始化
    if (!isInitialized.value && !isLoading.value) {
        加载所有项目()
    }

    const state: ProjectStateData = {
        projects,
        activeProjectId,
        activeProject,
        activeOriginalBlob,
        activeOriginalDataUrl,
        projectCount,
        hasProjects,
        isLoading,
        isSaving,
        isInitialized,
    }

    const actions: ProjectStateActions = {
        // === 初始化 ===
        加载所有项目,
        loadProjects: 加载所有项目,

        // === 项目 CRUD ===
        创建项目,
        createProject: 创建项目,
        批量创建项目,
        createProjects: 批量创建项目,
        切换项目,
        switchProject: 切换项目,
        更新项目参数,
        updateProjectParams: 更新项目参数,
        立即保存当前项目,
        saveCurrentProject: 立即保存当前项目,
        删除项目,
        deleteProject: 删除项目,
        清空所有项目,
        clearAllProjects: 清空所有项目,

        // === 批量操作 ===
        复制参数到项目,
        copyParamsToProjects: 复制参数到项目,
        应用参数到上方项目,
        applyParamsToAbove: 应用参数到上方项目,
        应用参数到下方项目,
        applyParamsToBelow: 应用参数到下方项目,
        应用参数到所有项目,
        applyParamsToAll: 应用参数到所有项目,
    }

    return { state, actions }
}

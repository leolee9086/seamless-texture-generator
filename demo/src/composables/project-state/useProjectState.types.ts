/**
 * 项目状态管理类型定义
 *
 * 按照 ECS 设计原则，分离 State (数据) 和 Actions (行为)
 */

import type { Ref, ShallowRef, ComputedRef } from './imports'
import type { ImageProject, ProjectParams } from './imports'

// ============================================================================
// State 接口 (纯数据)
// ============================================================================

/**
 * 项目状态 - 纯数据接口
 */
export interface ProjectStateData {
    /** 所有项目列表 */
    projects: Readonly<Ref<ImageProject[]>>
    /** 当前选中的项目 ID */
    activeProjectId: Readonly<Ref<string | null>>
    /** 当前活动项目 */
    activeProject: ComputedRef<ImageProject | null>
    /** 当前加载的原图 Blob */
    activeOriginalBlob: Readonly<ShallowRef<Blob | null>>
    /** 当前加载的原图 DataURL */
    activeOriginalDataUrl: Readonly<Ref<string | null>>
    /** 项目数量 */
    projectCount: ComputedRef<number>
    /** 是否有项目 */
    hasProjects: ComputedRef<boolean>
    /** 是否正在加载 */
    isLoading: Readonly<Ref<boolean>>
    /** 是否正在保存 */
    isSaving: Readonly<Ref<boolean>>
    /** 是否已初始化 */
    isInitialized: Readonly<Ref<boolean>>
}

// ============================================================================
// Actions 接口 (纯行为)
// ============================================================================

/**
 * 项目操作 - 纯行为接口
 */
export interface ProjectStateActions {
    // === 初始化 ===
    /** 加载所有项目 */
    加载所有项目: () => Promise<void>
    /** 加载所有项目 (英文别名) */
    loadProjects: () => Promise<void>

    // === 项目 CRUD ===
    /** 创建项目 */
    创建项目: (file: File) => Promise<ImageProject>
    /** 创建项目 (英文别名) */
    createProject: (file: File) => Promise<ImageProject>
    /** 批量创建项目 */
    批量创建项目: (files: File[]) => Promise<ImageProject[]>
    /** 批量创建项目 (英文别名) */
    createProjects: (files: File[]) => Promise<ImageProject[]>
    /** 切换项目 */
    切换项目: (id: string) => Promise<void>
    /** 切换项目 (英文别名) */
    switchProject: (id: string) => Promise<void>
    /** 更新项目参数 */
    更新项目参数: (params: Partial<ProjectParams>) => Promise<void>
    /** 更新项目参数 (英文别名) */
    updateProjectParams: (params: Partial<ProjectParams>) => Promise<void>
    /** 立即保存当前项目 */
    立即保存当前项目: () => Promise<void>
    /** 立即保存当前项目 (英文别名) */
    saveCurrentProject: () => Promise<void>
    /** 删除项目 */
    删除项目: (id: string) => Promise<void>
    /** 删除项目 (英文别名) */
    deleteProject: (id: string) => Promise<void>
    /** 清空所有项目 */
    清空所有项目: () => Promise<void>
    /** 清空所有项目 (英文别名) */
    clearAllProjects: () => Promise<void>

    // === 批量操作 ===
    /** 复制参数到项目 */
    复制参数到项目: (sourceId: string, targetIds: string[]) => Promise<void>
    /** 复制参数到项目 (英文别名) */
    copyParamsToProjects: (sourceId: string, targetIds: string[]) => Promise<void>
    /** 应用参数到上方项目 */
    应用参数到上方项目: (sourceId: string) => Promise<void>
    /** 应用参数到上方项目 (英文别名) */
    applyParamsToAbove: (sourceId: string) => Promise<void>
    /** 应用参数到下方项目 */
    应用参数到下方项目: (sourceId: string) => Promise<void>
    /** 应用参数到下方项目 (英文别名) */
    applyParamsToBelow: (sourceId: string) => Promise<void>
    /** 应用参数到所有项目 */
    应用参数到所有项目: (sourceId: string) => Promise<void>
    /** 应用参数到所有项目 (英文别名) */
    applyParamsToAll: (sourceId: string) => Promise<void>
}

// ============================================================================
// 包装器接口 (ECS 风格)
// ============================================================================

/**
 * useProjectState 返回值类型
 *
 * 采用 ECS 风格的包装器设计：
 * - state: 纯数据，只读的响应式状态
 * - actions: 纯行为，操作状态的方法
 */
export interface ProjectStateReturn {
    /** 状态数据 */
    state: ProjectStateData
    /** 操作方法 */
    actions: ProjectStateActions
}

/** useProjectState 返回值类型 (别名) */
export type ProjectState = ProjectStateReturn

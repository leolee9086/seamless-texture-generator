/**
 * 项目状态管理 - 响应式状态定义
 *
 * 存放项目列表的单例状态变量
 */

import { ref, shallowRef, computed } from './imports'
import type { Ref, ImageProject } from './imports'

// ============================================================================
// 单例状态 (模块作用域)
// ============================================================================

/** 所有项目列表 */
export const projects = ref<ImageProject[]>([])

/** 当前选中的项目 ID */
export const activeProjectId = ref<string | null>(null)

/** 是否正在加载 */
export const isLoading = ref(false)

/** 是否正在保存 */
export const isSaving = ref(false)

/** 是否已初始化 */
export const isInitialized = ref(false)

/**
 * 当前加载的原图 Blob
 *
 * 使用 shallowRef 避免深度响应式带来的性能问题
 */
export const activeOriginalBlob = shallowRef<Blob | null>(null)

/**
 * 当前加载的原图 DataURL
 *
 * 用于与现有的图像处理管线兼容
 */
export const activeOriginalDataUrl = ref<string | null>(null)

// ============================================================================
// 计算属性
// ============================================================================

/** @简洁函数 返回当前活动项目的计算属性 */
export const activeProject = computed(() =>
    projects.value.find(project => project.id === activeProjectId.value) ?? null
)

/** @简洁函数 项目数量计算属性 */
export const projectCount = computed(() => projects.value.length)

/** @简洁函数 是否有项目计算属性 */
export const hasProjects = computed(() => projects.value.length > 0)

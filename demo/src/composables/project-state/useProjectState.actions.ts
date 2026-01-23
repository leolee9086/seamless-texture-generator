/**
 * 项目状态管理 - 项目操作
 *
 * 包含项目的创建、切换、删除等操作
 */

import { projectFS } from './imports'
import type { ImageProject, ProjectParams } from './imports'
import { 生成缩略图, 获取图片尺寸, blobToDataURL, cloneDeep } from './useProjectState.utils'
import { 获取默认项目参数 } from './useProjectState.presets'
import { 默认缩略图尺寸, 保存防抖延迟 } from './useProjectState.constants'
import {
    原图资产路径,
    缩略图资产路径,
    原图资产Key,
    缩略图资产Key,
    资产路径前缀,
    项目创建失败消息
} from './useProjectState.templates'
import {
    projects,
    activeProjectId,
    activeOriginalBlob,
    activeOriginalDataUrl,
    isLoading,
    isSaving,
    isInitialized,
    activeProject
} from './useProjectState.state'
import { 确保项目模式 } from './useProjectState.canvas.utils'

// ============================================================================
// 防抖保存
// ============================================================================

/** 保存防抖定时器 */
let saveDebounceTimer: ReturnType<typeof setTimeout> | null = null

/**
 * 防抖保存项目到 IndexedDB
 * @param project 要保存的项目
 */
export function 防抖保存项目(project: ImageProject): void {
    if (saveDebounceTimer) {
        clearTimeout(saveDebounceTimer)
    }

    saveDebounceTimer = setTimeout(async () => {
        isSaving.value = true
        try {
            await projectFS.saveProject(cloneDeep(project))
        } finally {
            isSaving.value = false
        }
    }, 保存防抖延迟)
}

// ============================================================================
// 项目加载
// ============================================================================

/**
 * 从 IndexedDB 加载所有项目
 */
export async function 加载所有项目(): Promise<void> {
    if (isLoading.value) return

    isLoading.value = true
    try {
        const loaded = await projectFS.loadAllProjects()
        // 按更新时间倒序排列
        loaded.sort((项目A, 项目B) => 项目B.updatedAt - 项目A.updatedAt)
        projects.value = loaded

        // 如果有项目且未选中，自动选中最新的
        if (loaded.length > 0 && !activeProjectId.value) {
            await 切换项目(loaded[0].id)
        }

        isInitialized.value = true
    } finally {
        isLoading.value = false
    }
}

// ============================================================================
// 项目创建
// ============================================================================

/**
 * 创建新项目
 * @param file 上传的图片文件
 * @returns 创建的项目
 */
export async function 创建项目(file: File): Promise<ImageProject> {
    const id = crypto.randomUUID()
    const originalKey = 原图资产Key(id)
    const thumbKey = 缩略图资产Key(id)

    // 1. 获取图片尺寸
    const { width, height } = await 获取图片尺寸(file)

    // 2. 保存原图
    await projectFS.saveAsset(originalKey, file)

    // 3. 生成并保存缩略图
    const thumbnail = await 生成缩略图(file, 默认缩略图尺寸)
    await projectFS.saveAsset(thumbKey, thumbnail)

    // 4. 创建项目元数据
    const now = Date.now()
    const project: ImageProject = {
        id,
        name: file.name.replace(/\.[^.]+$/, ''),
        originalFileName: file.name,
        createdAt: now,
        updatedAt: now,
        originalPath: 原图资产路径(id),
        thumbnailPath: 缩略图资产路径(id),
        params: 获取默认项目参数(),
        width,
        height,
        fileSize: file.size,
        mimeType: file.type
    }

    // 5. 保存项目元数据
    await projectFS.saveProject(cloneDeep(project))

    // 6. 更新内存状态 (插入到列表开头)
    projects.value.unshift(project)

    return project
}

/**
 * 批量创建项目
 * @param files 图片文件列表
 * @returns 创建的项目列表
 */
export async function 批量创建项目(files: File[]): Promise<ImageProject[]> {
    const results: ImageProject[] = []
    for (const file of files) {
        try {
            const project = await 创建项目(file)
            results.push(project)
        } catch (error) {
            console.error(项目创建失败消息(file.name), error)
        }
    }
    return results
}

// ============================================================================
// 项目切换
// ============================================================================

/**
 * 切换当前项目
 * @param id 项目 ID
 */
export async function 切换项目(id: string): Promise<void> {
    // 如果切换到相同项目，跳过
    if (activeProjectId.value === id) return

    // 释放旧图内存 (DataURL 不需要手动释放)
    activeOriginalDataUrl.value = null
    activeOriginalBlob.value = null

    // 设置新的活动项目 ID
    activeProjectId.value = id

    const project = activeProject.value
    if (!project) return

    // 懒加载原图
    const originalKey = project.originalPath.replace(资产路径前缀, '')
    const blob = await projectFS.loadAsset(originalKey)

    // 竞态条件检查：如果加载期间切换了项目，则丢弃结果
    if (activeProjectId.value !== id) return

    if (!blob) return

    const dataUrl = await blobToDataURL(blob)

    // 再次检查竞态条件 (blobToDataURL 也是异步的)
    if (activeProjectId.value !== id) return

    activeOriginalBlob.value = blob
    activeOriginalDataUrl.value = dataUrl
    
    // 自动切换回项目模式（如果当前不是项目模式）
    await 确保项目模式()
}

// ============================================================================
// 项目更新
// ============================================================================

/**
 * 更新项目参数
 * @param params 要更新的参数 (部分)
 */
export async function 更新项目参数(params: Partial<ProjectParams>): Promise<void> {
    const project = activeProject.value
    if (!project) return

    // 合并参数
    Object.assign(project.params, params)
    project.updatedAt = Date.now()

    // 防抖保存
    防抖保存项目(project)
}

/**
 * 立即保存当前项目
 */
export async function 立即保存当前项目(): Promise<void> {
    const project = activeProject.value
    if (!project) return

    // 取消防抖定时器
    if (saveDebounceTimer) {
        clearTimeout(saveDebounceTimer)
        saveDebounceTimer = null
    }

    isSaving.value = true
    try {
        await projectFS.saveProject(cloneDeep(project))
    } finally {
        isSaving.value = false
    }
}

// ============================================================================
// 项目删除
// ============================================================================

/**
 * 删除项目
 * @param id 项目 ID
 */
export async function 删除项目(id: string): Promise<void> {
    const project = projects.value.find(项目 => 项目.id === id)
    if (!project) return

    // 从 IndexedDB 删除
    await projectFS.deleteProject(project)

    // 从内存中移除
    projects.value = projects.value.filter(项目 => 项目.id !== id)

    // 如果删除的是当前项目，切换到第一个
    if (activeProjectId.value !== id) return

    if (projects.value.length > 0) {
        await 切换项目(projects.value[0].id)
        return
    }

    activeProjectId.value = null
    activeOriginalBlob.value = null
    activeOriginalDataUrl.value = null
}

/**
 * 清空所有项目
 */
export async function 清空所有项目(): Promise<void> {
    await projectFS.clearAllProjects()
    projects.value = []
    activeProjectId.value = null
    activeOriginalBlob.value = null
    activeOriginalDataUrl.value = null
}

/**
 * 项目状态管理 - 批量操作
 *
 * 包含复制参数、批量应用等操作
 */

import { projectFS } from './imports'
import type { ProjectParams } from './imports'
import { projects } from './useProjectState.state'
import { cloneDeep } from './useProjectState.utils'

// ============================================================================
// 批量操作
// ============================================================================

/**
 * 复制参数到其他项目
 * @param sourceId 源项目 ID
 * @param targetIds 目标项目 ID 列表
 */
export async function 复制参数到项目(sourceId: string, targetIds: string[]): Promise<void> {
    const source = projects.value.find(项目 => 项目.id === sourceId)
    if (!source) return

    // 深拷贝参数
    const paramsCopy = JSON.parse(JSON.stringify(source.params)) as ProjectParams

    for (const id of targetIds) {
        const target = projects.value.find(项目 => 项目.id === id)
        if (!target) continue
        if (target.id === sourceId) continue

        target.params = { ...paramsCopy }
        target.updatedAt = Date.now()
        await projectFS.saveProject(cloneDeep(target))
    }
}

/**
 * 应用参数到上方所有项目
 * @param sourceId 源项目 ID
 */
export async function 应用参数到上方项目(sourceId: string): Promise<void> {
    const sourceIndex = projects.value.findIndex(项目 => 项目.id === sourceId)
    // 已经是第一个，没有上方项目
    if (sourceIndex <= 0) return

    const targetIds = projects.value
        .slice(0, sourceIndex)
        .map(项目 => 项目.id)

    await 复制参数到项目(sourceId, targetIds)
}

/**
 * 应用参数到下方所有项目
 * @param sourceId 源项目 ID
 */
export async function 应用参数到下方项目(sourceId: string): Promise<void> {
    const sourceIndex = projects.value.findIndex(项目 => 项目.id === sourceId)
    if (sourceIndex < 0) return
    if (sourceIndex >= projects.value.length - 1) return

    const targetIds = projects.value
        .slice(sourceIndex + 1)
        .map(项目 => 项目.id)

    await 复制参数到项目(sourceId, targetIds)
}

/**
 * 应用参数到所有其他项目
 * @param sourceId 源项目 ID
 */
export async function 应用参数到所有项目(sourceId: string): Promise<void> {
    const targetIds = projects.value
        .filter(项目 => 项目.id !== sourceId)
        .map(项目 => 项目.id)

    await 复制参数到项目(sourceId, targetIds)
}

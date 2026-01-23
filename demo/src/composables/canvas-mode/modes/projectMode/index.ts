/**
 * 项目模式 (Project Mode)
 *
 * 默认的画布模式，显示当前项目的处理结果
 * 
 * 特点：
 * - 图像来源于项目系统
 * - 参数变更自动持久化到 IndexedDB
 * - 这是当前的默认模式
 */

import { ref, watch, useProjectState } from './imports'
import type { CanvasOutput } from './imports'
import { CANVAS_MODE_IDS, MODE_DISPLAY_NAMES } from './imports'
import type { ProjectModeInstance } from './types'

/**
 * 创建项目模式实例
 */
export function createProjectMode(): ProjectModeInstance {
    const isDirty = ref(false)
    const { state: projectState, actions: projectActions } = useProjectState()
    
    // 当前处理后的图像（由外部处理管线提供）
    // 这个 ref 将在集成时由外部设置
    const processedImageRef = ref<string | null>(null)

    // 监听项目变化，标记为脏数据
    watch(
        () => projectState.activeProject.value?.params,
        /** @简洁函数 watch 回调函数，仅标记脏数据状态 */
        () => {
            isDirty.value = true
        },
        { deep: true }
    )

    return {
        id: CANVAS_MODE_IDS.PROJECT,
        displayName: MODE_DISPLAY_NAMES.PROJECT,
        persistStrategy: 'auto',
        isDirty,

        async onEnter(): Promise<void> {
            // 项目数据已经由 useProjectState 管理
            // 进入项目模式时，确保有活动项目
            if (!projectState.activeProject.value) {
                console.warn('[ProjectMode] 进入项目模式时没有活动项目')
            }
        },

        /** @简洁函数 退出项目模式时仅清理处理后的图像引用 */
        async onExit(): Promise<void> {
            processedImageRef.value = null
        },

        getOutput(): CanvasOutput {
            // 返回当前处理后的图像
            // 如果没有处理后的图像，返回原始图像
            const displayImage = processedImageRef.value || projectState.activeOriginalDataUrl.value
            
            return {
                displayImage,
                overlays: [],
                canBeSourceFor: ['procedural', 'paint'],
                metadata: {
                    mode: CANVAS_MODE_IDS.PROJECT,
                    projectId: projectState.activeProjectId.value,
                    hasProcessedImage: !!processedImageRef.value,
                },
            }
        },

        async persist(): Promise<void> {
            // 项目模式使用自动持久化策略
            // 参数变更会通过 useProjectState 自动保存
            await projectActions.立即保存当前项目()
            isDirty.value = false
        },

        /** @简洁函数 setter 方法，仅设置处理后的图像引用 */
        setProcessedImage(imageDataUrl: string | null): void {
            processedImageRef.value = imageDataUrl
        },
    }
}

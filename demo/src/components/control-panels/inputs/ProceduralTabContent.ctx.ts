/**
 * ProceduralTabContent 上下文逻辑
 *
 * 处理程序化纹理面板的状态和交互逻辑
 */

import { computed, ref, useCanvasModeManager, CANVAS_MODE_IDS } from './imports'
import { isProceduralModeInstance } from './ProceduralTabContent.guard'
import type { ProceduralTabContentState, SaveAsProjectFn } from './ProceduralTabContent.types'

/**
 * 创建程序化纹理面板状态
 */
export function createProceduralTabContentState(): ProceduralTabContentState {
    const canvasModeManager = useCanvasModeManager()
    const isSaving = ref(false)

    /** 是否可以保存为项目 */
    const canSaveAsProject = computed(() => {
        const isProceduralMode = canvasModeManager.activeModeId.value === CANVAS_MODE_IDS.PROCEDURAL
        const currentMode = canvasModeManager.activeMode.value
        const hasTexture = currentMode && isProceduralModeInstance(currentMode) && currentMode.getCurrentTexture()
        return !!(isProceduralMode && hasTexture && !isSaving.value)
    })

    /** 保存按钮样式 */
    const saveButtonClass = computed(() => {
        if (isSaving.value) {
            return 'bg-blue-500/50 text-white/70 cursor-wait'
        }
        return 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl'
    })

    return {
        isSaving,
        canSaveAsProject,
        saveButtonClass,
    }
}

/**
 * 创建保存为项目的函数
 */
export function createSaveAsProjectFn(
    state: ProceduralTabContentState
): SaveAsProjectFn {
    const canvasModeManager = useCanvasModeManager()

    return async (): Promise<void> => {
        if (state.isSaving.value) return

        try {
            state.isSaving.value = true
            await canvasModeManager.persistCurrentMode()
        } catch (error) {
            console.error('[ProceduralTabContent] 保存失败:', error)
        } finally {
            state.isSaving.value = false
        }
    }
}

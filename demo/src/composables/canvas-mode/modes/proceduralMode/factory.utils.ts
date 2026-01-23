/**
 * 程序化纹理模式 - 工厂函数
 * 
 * 将创建逻辑拆分为多个函数以满足行数限制
 */

import type { CanvasOutput } from './imports'
import { CANVAS_MODE_IDS } from './imports'
import type { ProjectStateActions } from './imports'
import { persistProceduralTexture } from './utils'
import { LOG_MESSAGES, CAN_BE_SOURCE_FOR_MODES } from './constants'

/**
 * 创建 getOutput 方法
 */
function createGetOutputMethod(
    getCurrentTexture: () => string | null,
    isDirty: { value: boolean },
    outputVersion: { value: number }
): () => CanvasOutput {
    return (): CanvasOutput => {
        // 访问 outputVersion.value 以建立响应式依赖
        // 这样当 outputVersion 变化时，computed 会重新计算
        const _version = outputVersion.value
        
        return {
            displayImage: getCurrentTexture(),
            overlays: [],
            canBeSourceFor: [...CAN_BE_SOURCE_FOR_MODES],
            metadata: {
                mode: CANVAS_MODE_IDS.PROCEDURAL,
                isDirty: isDirty.value,
                hasTexture: !!getCurrentTexture(),
                version: _version,
            },
        }
    }
}

/**
 * 创建 persist 方法
 */
function createPersistMethod(
    getCurrentTexture: () => string | null,
    projectActions: ProjectStateActions,
    isDirty: { value: boolean }
): () => Promise<void> {
    return async (): Promise<void> => {
        const logMessages = {
            noTexture: LOG_MESSAGES.NO_TEXTURE_TO_PERSIST,
            saved: LOG_MESSAGES.TEXTURE_SAVED,
        }
        const success = await persistProceduralTexture(
            getCurrentTexture(),
            projectActions,
            logMessages
        )
        if (success) {
            isDirty.value = false
        }
    }
}

export { createGetOutputMethod, createPersistMethod }

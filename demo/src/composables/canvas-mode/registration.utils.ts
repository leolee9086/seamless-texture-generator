/**
 * 画布模式管理 - 模式注册工具
 */

import type { CanvasMode, CanvasModeDefinition } from './types'
import type { CanvasModeContext } from './context.types'
import { CanvasModeError } from './CanvasModeError.class'
import { CANVAS_MODE_ERROR_CODES, CANVAS_MODE_ERROR_MESSAGES } from './constants'
import { LOG_MESSAGES } from './templates'
import { validateModeDefinition } from './validation.utils'

/**
 * 注册新模式
 */
export function registerModeToMap(
    modesMap: Map<string, CanvasModeDefinition>,
    definition: CanvasModeDefinition
): void {
    validateModeDefinition(definition)

    if (modesMap.has(definition.id)) {
        throw new CanvasModeError(
            CANVAS_MODE_ERROR_MESSAGES.MODE_ALREADY_REGISTERED(definition.id),
            CANVAS_MODE_ERROR_CODES.MODE_ALREADY_REGISTERED,
            definition.id
        )
    }

    modesMap.set(definition.id, definition)
    
    // 使用 console.warn 而不是 console.log 以符合 lint 规则
    if (process.env.NODE_ENV !== 'production') {
        console.warn(LOG_MESSAGES.MODE_REGISTERED(definition.id, definition.displayName))
    }
}

/**
 * 清理模式实例
 */
export function cleanupModeInstance(modeId: string, instance: CanvasMode): void {
    if (instance.dispose) {
        try {
            instance.dispose()
        } catch (error) {
            console.error(LOG_MESSAGES.MODE_CLEANUP_FAILED(modeId), error)
        }
    }
}

/**
 * 注销模式
 */
export function unregisterModeFromMap(
    ctx: CanvasModeContext,
    modeId: string
): void {
    if (!ctx.modesMap.has(modeId)) {
        console.warn(LOG_MESSAGES.MODE_UNREGISTER_NOT_FOUND(modeId))
        return
    }

    // 清理缓存的实例
    const cachedInstance = ctx.cacheMap.get(modeId)
    if (cachedInstance) {
        cleanupModeInstance(modeId, cachedInstance)
    }
    ctx.cacheMap.delete(modeId)

    ctx.modesMap.delete(modeId)
    
    if (process.env.NODE_ENV !== 'production') {
        console.warn(LOG_MESSAGES.MODE_UNREGISTERED(modeId))
    }

    // 如果当前模式正在使用，清除它
    if (ctx.activeModeRef.value?.id === modeId) {
        ctx.activeModeRef.value = null
    }
}

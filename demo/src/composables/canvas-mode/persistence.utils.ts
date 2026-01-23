/**
 * 画布模式管理 - 持久化工具
 */

import type { CanvasModeContext } from './context.types'
import { CanvasModeError } from './CanvasModeError.class'
import { CANVAS_MODE_ERROR_CODES, CANVAS_MODE_ERROR_MESSAGES, ENV_CONSTANTS } from './constants'
import { LOG_MESSAGES, TYPE_STRINGS } from './templates'

/**
 * 持久化当前模式结果
 */
export async function persistCurrentMode(ctx: CanvasModeContext): Promise<void> {
    if (!ctx.activeModeRef.value) {
        console.warn(LOG_MESSAGES.MODE_NO_ACTIVE)
        return
    }

    const modeId = ctx.activeModeRef.value.id
    const persistStrategy = ctx.activeModeRef.value.persistStrategy

    if (persistStrategy === TYPE_STRINGS.NONE) {
        console.warn(LOG_MESSAGES.MODE_NO_PERSIST_SUPPORT(modeId))
        return
    }

    if (!ctx.activeModeRef.value.persist) {
        console.warn(LOG_MESSAGES.MODE_NO_PERSIST_METHOD(modeId))
        return
    }

    try {
        if (process.env.NODE_ENV !== ENV_CONSTANTS.PRODUCTION) {
            console.warn(LOG_MESSAGES.MODE_PERSISTING(modeId))
        }
        
        await ctx.activeModeRef.value.persist()
        
        if (process.env.NODE_ENV !== ENV_CONSTANTS.PRODUCTION) {
            console.warn(LOG_MESSAGES.MODE_PERSIST_SUCCESS(modeId))
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        throw new CanvasModeError(
            CANVAS_MODE_ERROR_MESSAGES.PERSIST_FAILED(modeId, errorMessage),
            CANVAS_MODE_ERROR_CODES.PERSIST_FAILED,
            modeId
        )
    }
}

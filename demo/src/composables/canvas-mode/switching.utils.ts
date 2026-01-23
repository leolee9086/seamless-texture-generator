/**
 * 画布模式管理 - 模式切换工具
 */

import type { CanvasMode } from './types'
import type { CanvasModeContext } from './context.types'
import { CanvasModeError } from './CanvasModeError.class'
import { CANVAS_MODE_ERROR_CODES, CANVAS_MODE_ERROR_MESSAGES, ENV_CONSTANTS } from './constants'
import { LOG_MESSAGES } from './templates'

/**
 * 获取或创建模式实例
 */
export async function getOrCreateModeInstance(
    ctx: CanvasModeContext,
    modeId: string
): Promise<CanvasMode> {
    // 检查缓存
    const cached = ctx.cacheMap.get(modeId)
    if (cached) {
        return cached
    }

    // 获取定义
    const definition = ctx.modesMap.get(modeId)
    if (!definition) {
        throw new CanvasModeError(
            CANVAS_MODE_ERROR_MESSAGES.MODE_NOT_FOUND(modeId),
            CANVAS_MODE_ERROR_CODES.MODE_NOT_FOUND,
            modeId
        )
    }

    // 创建实例
    try {
        const instance = await definition.factory()
        ctx.cacheMap.set(modeId, instance)
        return instance
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        throw new CanvasModeError(
            CANVAS_MODE_ERROR_MESSAGES.MODE_SWITCH_FAILED(modeId, errorMessage),
            CANVAS_MODE_ERROR_CODES.MODE_SWITCH_FAILED,
            modeId
        )
    }
}

/**
 * 退出当前模式
 */
async function exitCurrentMode(currentMode: CanvasMode): Promise<void> {
    const currentModeId = currentMode.id
    
    if (process.env.NODE_ENV !== ENV_CONSTANTS.PRODUCTION) {
        console.warn(LOG_MESSAGES.MODE_EXITING(currentModeId))
    }
    
    try {
        await currentMode.onExit()
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error(
            CANVAS_MODE_ERROR_MESSAGES.MODE_EXIT_FAILED(currentModeId, errorMessage)
        )
        // 继续执行，不阻止切换
    }
}

/**
 * 进入新模式
 */
async function enterNewMode(newMode: CanvasMode): Promise<void> {
    const modeId = newMode.id
    
    if (process.env.NODE_ENV !== ENV_CONSTANTS.PRODUCTION) {
        console.warn(LOG_MESSAGES.MODE_ENTERING(modeId))
    }
    
    try {
        await newMode.onEnter()
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        throw new CanvasModeError(
            CANVAS_MODE_ERROR_MESSAGES.MODE_ENTER_FAILED(modeId, errorMessage),
            CANVAS_MODE_ERROR_CODES.MODE_ENTER_FAILED,
            modeId
        )
    }
}

/**
 * 切换模式的核心逻辑
 */
export async function performModeSwitch(
    ctx: CanvasModeContext,
    modeId: string
): Promise<void> {
    // 1. 退出当前模式
    if (ctx.activeModeRef.value) {
        await exitCurrentMode(ctx.activeModeRef.value)
    }

    // 2. 获取或创建新模式实例
    const newMode = await getOrCreateModeInstance(ctx, modeId)

    // 3. 进入新模式
    await enterNewMode(newMode)

    // 4. 设置为当前模式
    ctx.activeModeRef.value = newMode
    
    if (process.env.NODE_ENV !== ENV_CONSTANTS.PRODUCTION) {
        console.warn(LOG_MESSAGES.MODE_SWITCHED(modeId, newMode.displayName))
    }
}

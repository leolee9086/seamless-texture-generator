/**
 * 画布模式管理 - 输出工具
 */

import type { CanvasMode, CanvasOutput } from './types'
import { LOG_MESSAGES } from './templates'

/**
 * 获取模式输出
 *
 * 安全地获取当前模式的输出，如果失败则返回默认输出
 */
export function getModeOutput(activeMode: CanvasMode | null): CanvasOutput {
    if (!activeMode) {
        return {
            displayImage: null,
            overlays: [],
            canBeSourceFor: [],
            metadata: {},
        }
    }
    
    try {
        return activeMode.getOutput()
    } catch (error) {
        console.error(LOG_MESSAGES.MODE_GET_OUTPUT_FAILED(activeMode.id), error)
        return {
            displayImage: null,
            overlays: [],
            canBeSourceFor: [],
            metadata: {},
        }
    }
}

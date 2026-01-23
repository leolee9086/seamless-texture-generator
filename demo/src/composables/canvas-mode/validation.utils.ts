/**
 * 画布模式管理 - 验证工具
 */

import type { CanvasModeDefinition } from './types'
import { CanvasModeError } from './CanvasModeError.class'
import { CANVAS_MODE_ERROR_CODES, CANVAS_MODE_ERROR_MESSAGES } from './constants'
import { VALIDATION_MESSAGES, TYPE_STRINGS } from './templates'

/**
 * 验证模式定义的 ID
 */
function validateModeId(definition: CanvasModeDefinition): void {
    if (!definition.id || typeof definition.id !== TYPE_STRINGS.STRING) {
        throw new CanvasModeError(
            CANVAS_MODE_ERROR_MESSAGES.INVALID_MODE_DEFINITION(VALIDATION_MESSAGES.MISSING_ID),
            CANVAS_MODE_ERROR_CODES.INVALID_MODE_DEFINITION
        )
    }
}

/**
 * 验证模式定义的显示名称
 */
function validateModeDisplayName(definition: CanvasModeDefinition): void {
    if (!definition.displayName || typeof definition.displayName !== TYPE_STRINGS.STRING) {
        throw new CanvasModeError(
            CANVAS_MODE_ERROR_MESSAGES.INVALID_MODE_DEFINITION(VALIDATION_MESSAGES.MISSING_DISPLAY_NAME),
            CANVAS_MODE_ERROR_CODES.INVALID_MODE_DEFINITION,
            definition.id
        )
    }
}

/**
 * 验证模式定义的工厂函数
 */
function validateModeFactory(definition: CanvasModeDefinition): void {
    if (!definition.factory || typeof definition.factory !== TYPE_STRINGS.FUNCTION) {
        throw new CanvasModeError(
            CANVAS_MODE_ERROR_MESSAGES.INVALID_MODE_DEFINITION(VALIDATION_MESSAGES.MISSING_FACTORY),
            CANVAS_MODE_ERROR_CODES.INVALID_MODE_DEFINITION,
            definition.id
        )
    }
}

/**
 * 验证模式定义
 *
 * 检查模式定义是否包含所有必需的字段
 */
export function validateModeDefinition(definition: CanvasModeDefinition): void {
    validateModeId(definition)
    validateModeDisplayName(definition)
    validateModeFactory(definition)
}

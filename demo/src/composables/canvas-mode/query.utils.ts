/**
 * 画布模式管理 - 查询工具
 */

import type { CanvasModeDefinition } from './types'

/**
 * @简洁函数 检查模式是否已注册
 */
export function hasMode(modesMap: Map<string, CanvasModeDefinition>, modeId: string): boolean {
    return modesMap.has(modeId)
}

/**
 * @简洁函数 获取模式定义
 */
export function getModeDefinition(
    modesMap: Map<string, CanvasModeDefinition>,
    modeId: string
): CanvasModeDefinition | undefined {
    return modesMap.get(modeId)
}

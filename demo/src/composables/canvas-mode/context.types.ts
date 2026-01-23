/**
 * 画布模式管理 - 上下文类型
 *
 * 定义画布模式管理的领域上下文
 */

import type { Ref } from './imports'
import type { CanvasMode, CanvasModeDefinition } from './types'

/**
 * 画布模式管理上下文
 *
 * 包含模式管理所需的所有状态和映射
 */
export interface CanvasModeContext {
    /** 已注册的模式定义映射 */
    modesMap: Map<string, CanvasModeDefinition>
    /** 模式实例缓存映射 */
    cacheMap: Map<string, CanvasMode>
    /** 当前激活的模式引用 */
    activeModeRef: Ref<CanvasMode | null>
    /** 是否正在切换模式 */
    isSwitchingRef: Ref<boolean>
}

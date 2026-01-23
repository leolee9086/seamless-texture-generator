/**
 * 画布模式管理 - 主入口
 *
 * 提供画布模式管理的核心功能
 */

import { ref, computed, shallowRef } from './imports'
import type { CanvasMode, CanvasModeDefinition, CanvasModeManager, CanvasOutput } from './types'
import type { CanvasModeContext } from './context.types'
import { LOG_MESSAGES } from './templates'
import { registerModeToMap, unregisterModeFromMap } from './registration.utils'
import { performModeSwitch } from './switching.utils'
import { persistCurrentMode as persistMode } from './persistence.utils'
import { hasMode as checkMode, getModeDefinition as getDefinition } from './query.utils'
import { getModeOutput } from './output.utils'

// ============================================================================
// 单例状态
// ============================================================================

/** 已注册的模式定义 */
const registeredModes = new Map<string, CanvasModeDefinition>()

/** 当前激活的模式实例 */
const activeMode = shallowRef<CanvasMode | null>(null)

/** 是否正在切换模式 */
const isSwitching = ref(false)

/** 模式实例缓存 */
const modeInstanceCache = new Map<string, CanvasMode>()

// ============================================================================
// 上下文对象
// ============================================================================

/** 画布模式管理上下文 */
const canvasModeContext: CanvasModeContext = {
    modesMap: registeredModes,
    cacheMap: modeInstanceCache,
    activeModeRef: activeMode,
    isSwitchingRef: isSwitching,
}

// ============================================================================
// 计算属性
// ============================================================================

/**
 * @简洁函数 当前激活的模式 ID - 这是一个计算属性 getter
 */
const activeModeId = computed<string | null>(() => activeMode.value?.id ?? null)

/**
 * @简洁函数 主画布输出 - 这是一个计算属性 getter
 */
const canvasOutput = computed<CanvasOutput>(() => getModeOutput(activeMode.value))

// ============================================================================
// 核心功能函数
// ============================================================================

/**
 * @简洁函数 注册新模式
 * 这是一个简单的委托函数
 */
function registerMode(definition: CanvasModeDefinition): void {
    registerModeToMap(registeredModes, definition)
}

/**
 * @简洁函数 注销模式
 * 这是一个简单的委托函数
 */
function unregisterMode(modeId: string): void {
    unregisterModeFromMap(canvasModeContext, modeId)
}

/**
 * 切换模式
 */
async function switchMode(modeId: string): Promise<void> {
    // 防止重复切换
    if (isSwitching.value) {
        console.warn(LOG_MESSAGES.MODE_SWITCHING)
        return
    }

    // 如果已经是当前模式，直接返回
    if (activeMode.value?.id === modeId) {
        console.warn(LOG_MESSAGES.MODE_ALREADY_ACTIVE(modeId))
        return
    }

    isSwitching.value = true

    try {
        await performModeSwitch(canvasModeContext, modeId)
    } finally {
        isSwitching.value = false
    }
}

/**
 * @简洁函数 持久化当前模式结果
 * 这是一个简单的委托函数
 */
async function persistCurrentMode(): Promise<void> {
    await persistMode(canvasModeContext)
}

/**
 * @简洁函数 检查模式是否已注册
 * 这是一个简单的查询函数
 */
function hasMode(modeId: string): boolean {
    return checkMode(registeredModes, modeId)
}

/**
 * @简洁函数 获取模式定义
 * 这是一个简单的查询函数
 */
function getModeDefinition(modeId: string): CanvasModeDefinition | undefined {
    return getDefinition(registeredModes, modeId)
}

// ============================================================================
// 导出 Composable
// ============================================================================

/**
 * 使用画布模式管理器
 *
 * 这是一个单例 composable，所有组件共享同一个状态
 */
export function useCanvasModeManager(): CanvasModeManager {
    return {
        // 状态
        activeMode,
        activeModeId,
        modes: registeredModes,
        canvasOutput,
        isSwitching,

        // 方法
        switchMode,
        registerMode,
        unregisterMode,
        persistCurrentMode,
        hasMode,
        getModeDefinition,
    }
}

// 导出类型
export type { CanvasModeManager, CanvasMode, CanvasModeDefinition, CanvasOutput }

// 导出常量
import { CANVAS_MODE_IDS } from './constants'
export { CANVAS_MODE_IDS }

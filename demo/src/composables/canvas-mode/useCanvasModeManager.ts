/**
 * 画布模式管理器
 *
 * 核心功能：
 * 1. 管理多个画布模式的注册和切换
 * 2. 提供统一的画布输出接口
 * 3. 处理模式间的生命周期和数据隔离
 */

import { ref, computed, shallowRef } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import type {
    CanvasMode,
    CanvasModeDefinition,
    CanvasModeManager,
    CanvasOutput,
} from './types'
import { CanvasModeError } from './CanvasModeError.class'
import {
    CANVAS_MODE_ERROR_CODES,
    CANVAS_MODE_ERROR_MESSAGES,
    DEFAULT_CANVAS_OUTPUT,
} from './constants'

// ============================================================================
// 单例状态
// ============================================================================

/** 已注册的模式定义 */
const registeredModes = new Map<string, CanvasModeDefinition>()

/** 当前激活的模式实例 */
const activeMode = shallowRef<CanvasMode | null>(null)

/** 是否正在切换模式 */
const isSwitching = ref(false)

/** 模式实例缓存 (用于性能优化) */
const modeInstanceCache = new Map<string, CanvasMode>()

// ============================================================================
// 计算属性
// ============================================================================

/** 当前激活的模式 ID */
const activeModeId = computed<string | null>(() => {
    return activeMode.value?.id ?? null
})

/** 主画布输出 */
const canvasOutput = computed<CanvasOutput>(() => {
    if (!activeMode.value) {
        return { ...DEFAULT_CANVAS_OUTPUT }
    }
    try {
        return activeMode.value.getOutput()
    } catch (error) {
        console.error(`获取模式 ${activeMode.value.id} 的输出失败:`, error)
        return { ...DEFAULT_CANVAS_OUTPUT }
    }
})

// ============================================================================
// 核心功能函数
// ============================================================================

/**
 * 验证模式定义
 */
function validateModeDefinition(definition: CanvasModeDefinition): void {
    if (!definition.id || typeof definition.id !== 'string') {
        throw new CanvasModeError(
            CANVAS_MODE_ERROR_MESSAGES.INVALID_MODE_DEFINITION('缺少有效的 id'),
            CANVAS_MODE_ERROR_CODES.INVALID_MODE_DEFINITION
        )
    }
    if (!definition.displayName || typeof definition.displayName !== 'string') {
        throw new CanvasModeError(
            CANVAS_MODE_ERROR_MESSAGES.INVALID_MODE_DEFINITION('缺少有效的 displayName'),
            CANVAS_MODE_ERROR_CODES.INVALID_MODE_DEFINITION,
            definition.id
        )
    }
    if (!definition.factory || typeof definition.factory !== 'function') {
        throw new CanvasModeError(
            CANVAS_MODE_ERROR_MESSAGES.INVALID_MODE_DEFINITION('缺少有效的 factory 函数'),
            CANVAS_MODE_ERROR_CODES.INVALID_MODE_DEFINITION,
            definition.id
        )
    }
}

/**
 * 注册新模式
 */
function registerMode(definition: CanvasModeDefinition): void {
    validateModeDefinition(definition)

    if (registeredModes.has(definition.id)) {
        throw new CanvasModeError(
            CANVAS_MODE_ERROR_MESSAGES.MODE_ALREADY_REGISTERED(definition.id),
            CANVAS_MODE_ERROR_CODES.MODE_ALREADY_REGISTERED,
            definition.id
        )
    }

    registeredModes.set(definition.id, definition)
    console.log(`[CanvasModeManager] 已注册模式: ${definition.id} (${definition.displayName})`)
}

/**
 * 注销模式
 */
function unregisterMode(modeId: string): void {
    if (!registeredModes.has(modeId)) {
        console.warn(`[CanvasModeManager] 尝试注销不存在的模式: ${modeId}`)
        return
    }

    // 如果当前模式正在使用，先清理
    if (activeMode.value?.id === modeId) {
        activeMode.value = null
    }

    // 清理缓存的实例
    const cachedInstance = modeInstanceCache.get(modeId)
    if (cachedInstance && cachedInstance.dispose) {
        try {
            cachedInstance.dispose()
        } catch (error) {
            console.error(`[CanvasModeManager] 清理模式 ${modeId} 失败:`, error)
        }
    }
    modeInstanceCache.delete(modeId)

    registeredModes.delete(modeId)
    console.log(`[CanvasModeManager] 已注销模式: ${modeId}`)
}

/**
 * 获取或创建模式实例
 */
async function getOrCreateModeInstance(modeId: string): Promise<CanvasMode> {
    // 检查缓存
    const cached = modeInstanceCache.get(modeId)
    if (cached) {
        return cached
    }

    // 获取定义
    const definition = registeredModes.get(modeId)
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
        modeInstanceCache.set(modeId, instance)
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
 * 切换模式
 */
async function switchMode(modeId: string): Promise<void> {
    // 防止重复切换
    if (isSwitching.value) {
        console.warn(`[CanvasModeManager] 正在切换模式，请稍候`)
        return
    }

    // 如果已经是当前模式，直接返回
    if (activeMode.value?.id === modeId) {
        console.log(`[CanvasModeManager] 已经处于模式: ${modeId}`)
        return
    }

    isSwitching.value = true

    try {
        // 1. 退出当前模式
        if (activeMode.value) {
            const currentModeId = activeMode.value.id
            console.log(`[CanvasModeManager] 退出模式: ${currentModeId}`)
            try {
                await activeMode.value.onExit()
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error)
                console.error(
                    CANVAS_MODE_ERROR_MESSAGES.MODE_EXIT_FAILED(currentModeId, errorMessage)
                )
                // 继续执行，不阻止切换
            }
        }

        // 2. 获取或创建新模式实例
        const newMode = await getOrCreateModeInstance(modeId)

        // 3. 进入新模式
        console.log(`[CanvasModeManager] 进入模式: ${modeId}`)
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

        // 4. 设置为当前模式
        activeMode.value = newMode
        console.log(`[CanvasModeManager] 已切换到模式: ${modeId} (${newMode.displayName})`)
    } catch (error) {
        if (error instanceof CanvasModeError) {
            throw error
        }
        const errorMessage = error instanceof Error ? error.message : String(error)
        throw new CanvasModeError(
            CANVAS_MODE_ERROR_MESSAGES.MODE_SWITCH_FAILED(modeId, errorMessage),
            CANVAS_MODE_ERROR_CODES.MODE_SWITCH_FAILED,
            modeId
        )
    } finally {
        isSwitching.value = false
    }
}

/**
 * 持久化当前模式结果
 */
async function persistCurrentMode(): Promise<void> {
    if (!activeMode.value) {
        console.warn(`[CanvasModeManager] 没有激活的模式，无法持久化`)
        return
    }

    const modeId = activeMode.value.id
    const persistStrategy = activeMode.value.persistStrategy

    if (persistStrategy === 'none') {
        console.warn(`[CanvasModeManager] 模式 ${modeId} 不支持持久化`)
        return
    }

    if (!activeMode.value.persist) {
        console.warn(`[CanvasModeManager] 模式 ${modeId} 未实现 persist 方法`)
        return
    }

    try {
        console.log(`[CanvasModeManager] 持久化模式: ${modeId}`)
        await activeMode.value.persist()
        console.log(`[CanvasModeManager] 模式 ${modeId} 持久化成功`)
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        throw new CanvasModeError(
            CANVAS_MODE_ERROR_MESSAGES.PERSIST_FAILED(modeId, errorMessage),
            CANVAS_MODE_ERROR_CODES.PERSIST_FAILED,
            modeId
        )
    }
}

/**
 * 检查模式是否已注册
 */
function hasMode(modeId: string): boolean {
    return registeredModes.has(modeId)
}

/**
 * 获取模式定义
 */
function getModeDefinition(modeId: string): CanvasModeDefinition | undefined {
    return registeredModes.get(modeId)
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
        activeMode: activeMode as Ref<CanvasMode | null>,
        activeModeId,
        modes: registeredModes as ReadonlyMap<string, CanvasModeDefinition>,
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

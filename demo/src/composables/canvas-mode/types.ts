/**
 * 画布模式管理类型定义
 *
 * 定义了画布模式系统的核心接口和类型
 */

import type { Ref, ComputedRef } from 'vue'
import type { CanvasModeError } from './CanvasModeError.class'

// ============================================================================
// 画布输出接口
// ============================================================================

/**
 * 叠加层类型
 */
export interface OverlayLayer {
    /** 叠加层唯一标识 */
    id: string
    /** 叠加层类型 (grid, guide, mask 等) */
    type: string
    /** 叠加层数据 */
    data: unknown
    /** 是否可见 */
    visible: boolean
    /** 透明度 0-1 */
    opacity: number
}

/**
 * 画布输出
 *
 * 定义了画布显示的内容
 */
export interface CanvasOutput {
    /** 显示用的图像 (DataURL 或 ImageBitmap) */
    displayImage: string | ImageBitmap | null
    /** 可选的叠加层 (如网格、辅助线) */
    overlays?: OverlayLayer[]
    /** 允许其他模式使用此输出作为输入 */
    canBeSourceFor?: string[]
    /** 输出的元数据 */
    metadata?: {
        width?: number
        height?: number
        format?: string
        [key: string]: unknown
    }
}

// ============================================================================
// 画布模式接口
// ============================================================================

/**
 * 持久化策略
 */
export type PersistStrategy = 'none' | 'confirm' | 'auto'

/**
 * 画布模式接口
 *
 * 定义了一个画布模式的完整行为
 */
export interface CanvasMode {
    /** 模式唯一标识 */
    readonly id: string
    /** 显示名称 */
    readonly displayName: string
    /** 持久化策略 */
    readonly persistStrategy: PersistStrategy

    /** 进入模式时调用 */
    onEnter(): Promise<void>

    /** 退出模式时调用 */
    onExit(): Promise<void>

    /** 获取当前输出 */
    getOutput(): CanvasOutput

    /** 是否有未保存的更改 */
    readonly isDirty: Ref<boolean>

    /** 持久化当前模式的结果 */
    persist?(): Promise<void>

    /** 清理资源 */
    dispose?(): void
}

/**
 * 画布模式定义
 *
 * 用于注册新模式的配置对象
 */
export interface CanvasModeDefinition {
    /** 模式唯一标识 */
    id: string
    /** 显示名称 */
    displayName: string
    /** 持久化策略 */
    persistStrategy: PersistStrategy
    /** 创建模式实例的工厂函数 */
    factory: () => CanvasMode | Promise<CanvasMode>
}

// ============================================================================
// 画布模式管理器接口
// ============================================================================

/**
 * 画布模式管理器接口
 */
export interface CanvasModeManager {
    /** 当前激活的模式 */
    readonly activeMode: Ref<CanvasMode | null>
    /** 当前激活的模式 ID */
    readonly activeModeId: ComputedRef<string | null>
    /** 所有已注册的模式 */
    readonly modes: ReadonlyMap<string, CanvasModeDefinition>
    /** 主画布输出 (Viewer 组件应 watch 这个) */
    readonly canvasOutput: ComputedRef<CanvasOutput>
    /** 是否正在切换模式 */
    readonly isSwitching: Ref<boolean>

    /** 切换模式 */
    switchMode(modeId: string): Promise<void>

    /** 注册新模式 */
    registerMode(definition: CanvasModeDefinition): void

    /** 注销模式 */
    unregisterMode(modeId: string): void

    /** 持久化当前模式结果 */
    persistCurrentMode(): Promise<void>

    /** 检查模式是否已注册 */
    hasMode(modeId: string): boolean

    /** 获取模式定义 */
    getModeDefinition(modeId: string): CanvasModeDefinition | undefined
}

// ============================================================================
// 模式 ID 常量
// ============================================================================

/**
 * 内置模式 ID
 */
export const CANVAS_MODE_IDS = {
    /** 项目模式 */
    PROJECT: 'project',
    /** 程序化纹理模式 */
    PROCEDURAL: 'procedural',
    /** 绘制模式 (未来) */
    PAINT: 'paint',
    /** AI 生成模式 (未来) */
    AI_GENERATE: 'ai-generate',
} as const

export type CanvasModeId = (typeof CANVAS_MODE_IDS)[keyof typeof CANVAS_MODE_IDS]

// ============================================================================
// 错误类型
// ============================================================================

export type { CanvasModeError }

/**
 * 错误代码
 */
export const CANVAS_MODE_ERROR_CODES = {
    MODE_NOT_FOUND: 'MODE_NOT_FOUND',
    MODE_ALREADY_REGISTERED: 'MODE_ALREADY_REGISTERED',
    MODE_SWITCH_FAILED: 'MODE_SWITCH_FAILED',
    MODE_ENTER_FAILED: 'MODE_ENTER_FAILED',
    MODE_EXIT_FAILED: 'MODE_EXIT_FAILED',
    PERSIST_FAILED: 'PERSIST_FAILED',
    INVALID_MODE_DEFINITION: 'INVALID_MODE_DEFINITION',
} as const

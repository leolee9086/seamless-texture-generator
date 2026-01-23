/**
 * 画布模式管理常量
 */

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

/**
 * 错误消息模板
 */
export const CANVAS_MODE_ERROR_MESSAGES = {
    MODE_NOT_FOUND: (modeId: string) => `画布模式未找到: ${modeId}`,
    MODE_ALREADY_REGISTERED: (modeId: string) => `画布模式已注册: ${modeId}`,
    MODE_SWITCH_FAILED: (modeId: string, reason: string) => `切换到模式 ${modeId} 失败: ${reason}`,
    MODE_ENTER_FAILED: (modeId: string, reason: string) => `进入模式 ${modeId} 失败: ${reason}`,
    MODE_EXIT_FAILED: (modeId: string, reason: string) => `退出模式 ${modeId} 失败: ${reason}`,
    PERSIST_FAILED: (modeId: string, reason: string) => `持久化模式 ${modeId} 失败: ${reason}`,
    INVALID_MODE_DEFINITION: (reason: string) => `无效的模式定义: ${reason}`,
} as const

/**
 * 默认画布输出
 */
export const DEFAULT_CANVAS_OUTPUT = {
    displayImage: null,
    overlays: [],
    canBeSourceFor: [],
    metadata: {},
} as const

/**
 * 环境常量
 */
export const ENV_CONSTANTS = {
    PRODUCTION: 'production',
} as const

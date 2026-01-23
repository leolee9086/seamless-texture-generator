/**
 * 画布模式管理 - 模板字符串
 */

/**
 * 日志消息模板
 */
export const LOG_MESSAGES = {
    MODE_REGISTERED: (modeId: string, displayName: string) =>
        `[CanvasModeManager] 已注册模式: ${modeId} (${displayName})`,
    MODE_UNREGISTERED: (modeId: string) =>
        `[CanvasModeManager] 已注销模式: ${modeId}`,
    MODE_UNREGISTER_NOT_FOUND: (modeId: string) =>
        `[CanvasModeManager] 尝试注销不存在的模式: ${modeId}`,
    MODE_CLEANUP_FAILED: (modeId: string) =>
        `[CanvasModeManager] 清理模式 ${modeId} 失败:`,
    MODE_SWITCHING: `[CanvasModeManager] 正在切换模式，请稍候`,
    MODE_ALREADY_ACTIVE: (modeId: string) =>
        `[CanvasModeManager] 已经处于模式: ${modeId}`,
    MODE_EXITING: (modeId: string) =>
        `[CanvasModeManager] 退出模式: ${modeId}`,
    MODE_ENTERING: (modeId: string) =>
        `[CanvasModeManager] 进入模式: ${modeId}`,
    MODE_SWITCHED: (modeId: string, displayName: string) =>
        `[CanvasModeManager] 已切换到模式: ${modeId} (${displayName})`,
    MODE_GET_OUTPUT_FAILED: (modeId: string) =>
        `获取模式 ${modeId} 的输出失败:`,
    MODE_NO_ACTIVE: `[CanvasModeManager] 没有激活的模式，无法持久化`,
    MODE_NO_PERSIST_SUPPORT: (modeId: string) =>
        `[CanvasModeManager] 模式 ${modeId} 不支持持久化`,
    MODE_NO_PERSIST_METHOD: (modeId: string) =>
        `[CanvasModeManager] 模式 ${modeId} 未实现 persist 方法`,
    MODE_PERSISTING: (modeId: string) =>
        `[CanvasModeManager] 持久化模式: ${modeId}`,
    MODE_PERSIST_SUCCESS: (modeId: string) =>
        `[CanvasModeManager] 模式 ${modeId} 持久化成功`,
} as const

/**
 * 验证错误消息
 */
export const VALIDATION_MESSAGES = {
    MISSING_ID: '缺少有效的 id',
    MISSING_DISPLAY_NAME: '缺少有效的 displayName',
    MISSING_FACTORY: '缺少有效的 factory 函数',
} as const

/**
 * 类型检查字符串
 */
export const TYPE_STRINGS = {
    STRING: 'string',
    FUNCTION: 'function',
    NONE: 'none',
} as const

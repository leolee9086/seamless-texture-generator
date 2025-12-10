/**
 * 去雾面板相关的文本模板
 */

// 错误消息模板
export const INVALID_PARAM_KEY_WARNING = 'Invalid dehaze parameter key: '

// 控制台警告消息模板
export const INVALID_PARAM_KEY_WARNING_TEMPLATE = (key: string): string =>
    `${INVALID_PARAM_KEY_WARNING}${key}`
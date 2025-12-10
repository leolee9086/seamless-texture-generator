/**
 * 清晰度面板相关的常量
 */

// 错误消息
export const INVALID_PARAM_KEY_WARNING = 'Invalid clarity parameter key: '

// 导入/导出错误消息
export const IMPORT_ERROR_MESSAGE = '导入参数失败，请检查文件格式'
export const IMPORT_ERROR_CONSOLE = '导入参数失败:'

// 控制台警告消息模板
export const INVALID_PARAM_KEY_WARNING_TEMPLATE = (key: string): string =>
    `${INVALID_PARAM_KEY_WARNING}${key}`
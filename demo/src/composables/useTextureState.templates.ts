/**
 * useTextureState - 模板字符串
 */

/**
 * 日志消息模板
 * @简洁函数 模板函数，仅用于生成日志消息字符串
 */
export const LOG_MESSAGES = {
    /** 非项目模式下不创建项目的警告 */
    NOT_IN_PROJECT_MODE: (currentMode: string) =>
        `[创建原图代理] 当前处于 ${currentMode} 模式，不会创建新项目`,
} as const

/**
 * 生成上传文件名
 * @简洁函数 模板函数，仅用于生成文件名字符串
 */
export function 生成上传文件名(timestamp: number): string {
    return `upload-${timestamp}.png`
}

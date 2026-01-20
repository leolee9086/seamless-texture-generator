/**
 * 生成上传文件名
 * @简洁函数 简单的字符串拼接模板
 * @param timestamp 时间戳
 * @returns 文件名
 */
export function 生成上传文件名(timestamp: number): string {
    return `uploaded_${timestamp}.png`
}

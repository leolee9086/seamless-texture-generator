/**
 * 水印功能模板定义
 */

/**
 * @简洁函数 字体样式生成工具函数
 * 生成字体样式字符串
 * @param fontSize 字体大小（像素）
 * @returns 完整的 CSS font 属性值
 */
export function 生成字体样式(fontSize: number): string {
    return `${fontSize}px Arial, sans-serif`
}

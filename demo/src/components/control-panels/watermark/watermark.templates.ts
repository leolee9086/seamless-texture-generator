/**
 * 水印功能模板定义
 */

import { FONT_FALLBACK } from './watermark.constants'

/**
 * @简洁函数 字体样式生成工具函数
 * 生成字体样式字符串
 * @param fontSize 字体大小（像素）
 * @param fontFamily 字体族名称（可选，默认使用回退字体）
 * @returns 完整的 CSS font 属性值
 */
export function 生成字体样式(fontSize: number, fontFamily?: string): string {
    const family = fontFamily ? `"${fontFamily}", ${FONT_FALLBACK}` : FONT_FALLBACK
    return `${fontSize}px ${family}`
}

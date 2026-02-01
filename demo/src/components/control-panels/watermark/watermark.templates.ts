/**
 * 水印功能模板定义
 */

import { FONT_FALLBACK } from './watermark.constants'

/** 字体样式生成上下文 */
export interface 字体样式上下文 {
    字体大小: number
    字体?: string
    字重?: string
    斜体?: boolean
}

/**
 * @简洁函数 字体样式生成工具函数
 * 生成字体样式字符串
 * @param ctx 字体样式上下文
 * @returns 完整的 CSS font 属性值
 */
export function 生成字体样式(ctx: 字体样式上下文): string {
    const parts: string[] = []
    
    // 字体样式（斜体）
    if (ctx.斜体) {
        parts.push('italic')
    }
    
    // 字重
    if (ctx.字重) {
        parts.push(ctx.字重)
    }
    
    // 字体大小
    parts.push(`${ctx.字体大小}px`)
    
    // 字体族（带回退）
    const family = ctx.字体 ? `"${ctx.字体}", ${FONT_FALLBACK}` : FONT_FALLBACK
    parts.push(family)
    
    return parts.join(' ')
}

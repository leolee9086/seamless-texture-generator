/**
 * 水印字体服务模块
 * 提供系统字体获取和管理功能
 */

import type { 字体信息, FontData } from './watermark.types'
import { getQueryLocalFontsFromWindow } from './watermark.guard'
import { DEFAULT_FONT_FAMILY, FONT_FALLBACK } from './watermark.constants'

/** 预定义的安全字体列表（跨平台通用） */
export const SAFE_FONTS: 字体信息[] = [
    { family: 'Arial', fullName: 'Arial' },
    { family: 'Helvetica', fullName: 'Helvetica' },
    { family: 'Times New Roman', fullName: 'Times New Roman' },
    { family: 'Georgia', fullName: 'Georgia' },
    { family: 'Verdana', fullName: 'Verdana' },
    { family: 'Courier New', fullName: 'Courier New' },
    { family: 'Microsoft YaHei', fullName: '微软雅黑' },
    { family: 'SimHei', fullName: '黑体' },
    { family: 'SimSun', fullName: '宋体' },
    { family: 'KaiTi', fullName: '楷体' }
]

/**
 * 检查 Local Font Access API 是否可用
 * @简洁函数 API可用性检查
 */
export function isLocalFontAccessAvailable(): boolean {
    return 'queryLocalFonts' in window
}

/**
 * 使用 Local Font Access API 获取系统字体
 * 需要用户授权，如果不可用或用户拒绝则返回预定义字体列表
 */
export async function getSystemFonts(): Promise<字体信息[]> {
    if (!isLocalFontAccessAvailable()) {
        console.warn('Local Font Access API 不可用，使用预定义字体列表')
        return SAFE_FONTS
    }

    try {
        const queryLocalFonts = getQueryLocalFontsFromWindow()
        if (!queryLocalFonts) {
            return SAFE_FONTS
        }
        const fonts = await queryLocalFonts()
        return deduplicateFonts(fonts)
    } catch (error) {
        console.warn('获取系统字体失败:', error)
        return SAFE_FONTS
    }
}

/**
 * 去重并转换字体数据格式
 * @param fonts 原始字体数据数组
 */
function deduplicateFonts(fonts: FontData[]): 字体信息[] {
    const fontMap = new Map<string, 字体信息>()

    for (const font of fonts) {
        if (!fontMap.has(font.family)) {
            fontMap.set(font.family, {
                family: font.family,
                fullName: font.fullName,
                style: font.style
            })
        }
    }

    return Array.from(fontMap.values())
}

/**
 * 获取可用字体列表（优先使用系统字体，降级到安全字体）
 * 这是主要的对外接口
 */
export async function getAvailableFonts(): Promise<字体信息[]> {
    const systemFonts = await getSystemFonts()

    // 如果获取到系统字体，按字母顺序排序
    if (systemFonts.length > SAFE_FONTS.length) {
        return sortFontsByName(systemFonts)
    }

    return systemFonts
}

/**
 * 按字体名称排序
 * @简洁函数 字体排序工具函数
 * @param fonts 字体列表
 */
function sortFontsByName(fonts: 字体信息[]): 字体信息[] {
    return fonts.sort((fontA, fontB) => fontA.fullName.localeCompare(fontB.fullName))
}

/**
 * 获取默认字体族名称
 * @简洁函数 默认值获取函数
 */
export function getDefaultFont(): string {
    return DEFAULT_FONT_FAMILY
}

/**
 * 获取字体回退字符串
 * @简洁函数 回退值获取函数
 */
export function getFontFallback(): string {
    return FONT_FALLBACK
}

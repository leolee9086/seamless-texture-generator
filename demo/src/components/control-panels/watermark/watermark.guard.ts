/**
 * 水印功能类型守卫与数据迁移
 */
import type { 网格间距配置, 水印配置, 水印样式, FontData, QueryLocalFontsFunction, 文本样式配置 } from './watermark.types'
import { DEFAULT_ROTATION_ANGLE, 默认水印配置 } from './watermark.constants'

/**
 * 检查值是否为数值类型
 * @简洁函数 这是一个类型守卫谓词函数
 * @param value 待检查的值
 * @returns 是否为数值
 */
export function isNumber(value: unknown): value is number {
    return typeof value === 'number'
}

/**
 * 检查值是否为网格间距配置对象
 * @param value 待检查的值
 * @returns 是否为网格间距配置
 */
export function is网格间距配置(value: unknown): value is 网格间距配置 {
    if (value === null || typeof value !== 'object') {
        return false
    }
    const obj = value as Record<string, unknown>
    return typeof obj['行间距'] === 'number' && typeof obj['列间距'] === 'number'
}

/**
 * 标准化间距配置（兼容旧版单一数值格式）
 * @param spacing 间距配置（可能是数值或对象）
 * @returns 标准化后的网格间距配置
 */
export function normalizeSpacing(spacing: number | 网格间距配置): 网格间距配置 {
    if (isNumber(spacing)) {
        return { 行间距: spacing, 列间距: spacing }
    }
    return spacing
}

/**
 * 检查配置是否为旧版格式（网格间距为数值）
 * @param config 待检查的配置对象
 * @returns 是否为旧版格式
 */
export function is旧版水印配置(config: unknown): boolean {
    if (config === null || typeof config !== 'object') {
        return false
    }
    const obj = config as Record<string, unknown>
    return isNumber(obj['网格间距'])
}

/**
 * 解析网格间距配置
 * @param rawSpacing 原始间距值
 * @returns 标准化的网格间距配置
 */
function 解析网格间距(rawSpacing: unknown): 网格间距配置 {
    if (isNumber(rawSpacing)) {
        return { 行间距: rawSpacing, 列间距: rawSpacing }
    }
    if (is网格间距配置(rawSpacing)) {
        return rawSpacing
    }
    return 默认水印配置.网格间距
}

/**
 * 解析旋转角度
 * @param rawAngle 原始角度值
 * @returns 标准化的旋转角度
 */
function 解析旋转角度(rawAngle: unknown): number {
    if (isNumber(rawAngle)) {
        return rawAngle
    }
    return DEFAULT_ROTATION_ANGLE
}

/**
 * 迁移旧版水印配置到新版格式
 * 将单一的网格间距数值转换为行间距和列间距对象
 * 添加默认的旋转角度
 * @param oldConfig 旧版配置对象
 * @returns 迁移后的新版水印配置
 */
/**
 * 检查值是否为字符串类型
 * @简洁函数 这是一个类型守卫谓词函数
 * @param value 待检查的值
 * @returns 是否为字符串
 */
export function isString(value: unknown): value is string {
    return typeof value === 'string'
}

/**
 * 解析字体配置
 * @param rawFont 原始字体值
 * @returns 标准化的字体族名称
 */
function 解析字体(rawFont: unknown): string {
    if (isString(rawFont) && rawFont.length > 0) {
        return rawFont
    }
    return 默认水印配置.字体
}

export function migrateWatermarkConfig(oldConfig: unknown): 水印配置 {
    const config = oldConfig as Record<string, unknown>

    const 网格间距 = 解析网格间距(config['网格间距'])
    const 旋转角度 = 解析旋转角度(config['旋转角度'])
    const 字体 = 解析字体(config['字体'])

    return {
        样式: (config['样式'] as 水印样式) ?? 默认水印配置.样式,
        文本: (config['文本'] as string) ?? 默认水印配置.文本,
        字体大小: isNumber(config['字体大小']) ? config['字体大小'] : 默认水印配置.字体大小,
        字体,
        不透明度: isNumber(config['不透明度']) ? config['不透明度'] : 默认水印配置.不透明度,
        网格间距,
        旋转角度,
        颜色: (config['颜色'] as string) ?? 默认水印配置.颜色,
        文本样式: 默认水印配置.文本样式 // 新增：为旧配置添加默认文本样式
    }
}

/**
 * 检查值是否为 FontData 对象
 * @param value 待检查的值
 * @returns 是否为 FontData
 */
export function isFontData(value: unknown): value is FontData {
    if (value === null || typeof value !== 'object') {
        return false
    }
    const obj = value as Record<string, unknown>
    return (
        typeof obj['family'] === 'string' &&
        typeof obj['fullName'] === 'string' &&
        typeof obj['style'] === 'string' &&
        typeof obj['postscriptName'] === 'string'
    )
}

/**
 * 检查值是否为 queryLocalFonts 函数
 * @简洁函数 这是一个类型守卫谓词函数
 * @param value 待检查的值
 * @returns 是否为 queryLocalFonts 函数
 */
export function isQueryLocalFontsFunction(value: unknown): value is QueryLocalFontsFunction {
    return typeof value === 'function'
}

/**
 * 从 window 对象获取 queryLocalFonts 函数（类型安全）
 * @returns queryLocalFonts 函数或 undefined
 */
export function getQueryLocalFontsFromWindow(): QueryLocalFontsFunction | undefined {
    const windowObj = window as unknown as Record<string, unknown>
    const queryLocalFonts = windowObj['queryLocalFonts']
    if (isQueryLocalFontsFunction(queryLocalFonts)) {
        return queryLocalFonts
    }
    return undefined
}

/**
 * 检查值是否为有效的字重值
 * @param value 待检查的值
 * @returns 是否为有效字重
 */
export function isValidFontWeight(value: unknown): value is 文本样式配置['字重'] {
    if (!isString(value)) {
        return false
    }
    const validWeights = ['100', '200', '300', '400', '500', '600', '700', '800', '900', 'normal', 'bold']
    return validWeights.includes(value)
}

/**
 * LUTPanel 类型定义
 */

/**
 * 缩略图创建参数
 */
export interface 缩略图创建参数 {
    原图URL: string
    处理后URL: string
    宽度?: number
    高度?: number
}

/**
 * 移动端 Tab 类型
 */
export type MobileTab = 'lut' | 'add' | string

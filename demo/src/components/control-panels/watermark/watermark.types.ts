/**
 * 水印功能类型定义
 */

/** 水印样式 */
export type 水印样式 = 'grid' | 'center'

/** 水印配置 */
export interface 水印配置 {
    样式: 水印样式
    文本: string
    字体大小: number
    不透明度: number
    网格间距: number // 仅 grid 样式有效
    颜色: string
}

/** 水印预设 */
export interface 水印预设 {
    id: string
    名称: string
    配置: 水印配置
    创建时间: number
}

/** 预设元数据（用于 IndexedDB 列表管理） */
export interface 预设列表元数据 {
    id: string
    预设IDs: string[]
}

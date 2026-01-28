/**
 * 水印功能常量
 */
import type { 水印配置 } from './watermark.types'

/** IndexedDB 配置 */
export const WATERMARK_DB = {
    /** 数据库名称 */
    DB_NAME: 'WatermarkPresetsDB',
    /** 预设存储名 */
    PRESETS_STORE: 'presets',
    /** 预设列表存储名 */
    LIST_STORE: 'preset_list',
    /** 列表 ID */
    LIST_ID: 'preset_ids',
    /** 数据库版本 */
    VERSION: 1
} as const

/** 默认水印配置 */
export const 默认水印配置: 水印配置 = {
    样式: 'grid',
    文本: 'WATERMARK',
    字体大小: 24,
    不透明度: 0.3,
    网格间距: 150,
    颜色: '#888888'
}

/** 配置范围限制 */
export const 配置范围 = {
    字体大小: { min: 8, max: 72, step: 1 },
    不透明度: { min: 0.05, max: 1, step: 0.05 },
    网格间距: { min: 50, max: 400, step: 10 }
} as const

/** 图像 MIME 类型 */
export const IMAGE_MIME_TYPE_PNG = 'image/png' as const

/** 错误消息 */
export const ERROR_CANVAS_CONTEXT_FAILED = '无法获取 Canvas 上下文'
export const ERROR_IMAGE_LOAD_FAILED = '图片加载失败'
export const ERROR_CANVAS_TO_BLOB_FAILED = 'Canvas toBlob 失败'

/** Canvas 文本对齐常量 */
export const TEXT_ALIGN_CENTER = 'center' as const
export const TEXT_BASELINE_MIDDLE = 'middle' as const

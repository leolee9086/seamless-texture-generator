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

/** 默认字体族名称 */
export const DEFAULT_FONT_FAMILY = 'Arial'

/** 字体回退列表 */
export const FONT_FALLBACK = 'Arial, sans-serif'

/** 字重选项列表 */
export const FONT_WEIGHT_OPTIONS = [
    { value: 'normal', label: '正常 (400)' },
    { value: 'bold', label: '粗体 (700)' },
    { value: '100', label: '极细 (100)' },
    { value: '200', label: '特细 (200)' },
    { value: '300', label: '细体 (300)' },
    { value: '400', label: '正常 (400)' },
    { value: '500', label: '中等 (500)' },
    { value: '600', label: '半粗 (600)' },
    { value: '700', label: '粗体 (700)' },
    { value: '800', label: '特粗 (800)' },
    { value: '900', label: '极粗 (900)' }
] as const

/** 默认文本样式配置 */
export const 默认文本样式配置 = {
    字重: 'normal' as const,
    斜体: false,
    描边宽度: 0,
    描边颜色: '#000000'
}

/** 默认水印配置 */
export const 默认水印配置: 水印配置 = {
    样式: 'grid',
    文本: 'WATERMARK',
    字体大小: 24,
    字体: DEFAULT_FONT_FAMILY,
    不透明度: 0.3,
    网格间距: {
        行间距: 150,
        列间距: 150
    },
    旋转角度: 45,
    颜色: '#888888',
    文本样式: 默认文本样式配置
}

/** 配置范围限制 */
export const 配置范围 = {
    字体大小: { min: 8, max: 72, step: 1 },
    不透明度: { min: 0.05, max: 1, step: 0.05 },
    行间距: { min: 30, max: 400, step: 5 },
    列间距: { min: 30, max: 400, step: 5 },
    旋转角度: { min: 0, max: 360, step: 1 },
    描边宽度: { min: 0, max: 5, step: 0.5 },
    /** @deprecated 使用 行间距 和 列间距 替代 */
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

/** 旋转角度相关常量 */
export const DEFAULT_ROTATION_ANGLE = 45
export const DEGREES_IN_HALF_CIRCLE = 180

/** 预设 ID 前缀 */
export const PRESET_ID_PREFIX = 'preset_'

/** 预设 ID 分隔符 */
export const PRESET_ID_SEPARATOR = '_'

/** 类型检查常量 */
export const TYPE_OBJECT = 'object' as const

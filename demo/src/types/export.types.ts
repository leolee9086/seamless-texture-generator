import type { 水印配置 } from '../components/control-panels/watermark/watermark.types'

/**
 * 导出预设配置
 * 用户可创建多个预设，批量导出时选择应用
 */
export interface ExportPreset {
    /** 预设名称 */
    name: string
    /** 预设 ID */
    id: string

    // === 文件格式 ===
    /** 输出格式 */
    format: 'webp' | 'png' | 'jpeg'
    /** JPEG/WebP 质量 (0.1-1.0) - 注意：Lightroom 是 1-100，这里我们归一化为 0-1 */
    quality: number

    // === 尺寸调整 ===
    /** 是否调整尺寸 */
    resizeEnabled: boolean
    /** 调整模式 */
    resizeMode: 'longEdge' | 'shortEdge' | 'width' | 'height' | 'percentage'
    /** 目标尺寸 (像素或百分比) */
    resizeValue: number

    // === 文件命名 ===
    /** 命名模板，支持 {name}, {index}, {date} 等变量 */
    namingTemplate: string
    /** 后缀 (如 _seamless) */
    suffix: string

    // === 水印 ===
    /** 是否添加水印 */
    watermarkEnabled: boolean
    /** 水印配置 */
    watermarkConfig?: 水印配置

    // === 高级 ===
    /** 是否保留元数据 (TODO) */
    keepMetadata: boolean
    /** 色彩空间 (TODO) */
    colorSpace: 'sRGB' | 'original'
}

/**
 * 导出任务状态
 */
export interface ExportTask {
    projectId: string
    projectName: string
    status: 'pending' | 'processing' | 'done' | 'error' | 'cancelled'
    result?: Blob
    error?: Error
    /** 处理开始时间 (用于计算预估时间) */
    startTime?: number
    /** 处理完成时间 */
    endTime?: number
}

/** 默认导出预设 */
export const 默认导出预设: ExportPreset = {
    name: '默认 - WebP 高质量',
    id: 'default',
    format: 'webp',
    quality: 0.9,
    resizeEnabled: false,
    resizeMode: 'longEdge',
    resizeValue: 2048,
    namingTemplate: '{name}',
    suffix: '_seamless',
    watermarkEnabled: false,
    keepMetadata: false,
    colorSpace: 'sRGB'
}

/** 预置导出预设库 */
export const 内置导出预设: ExportPreset[] = [
    { ...默认导出预设 },
    {
        name: '社交媒体 - JPEG 中等',
        id: 'social',
        format: 'jpeg',
        quality: 0.8,
        resizeEnabled: true,
        resizeMode: 'longEdge',
        resizeValue: 1080,
        namingTemplate: '{name}',
        suffix: '_web',
        watermarkEnabled: false,
        keepMetadata: false,
        colorSpace: 'sRGB'
    },
    {
        name: '打印 - PNG 无损',
        id: 'print',
        format: 'png',
        quality: 1.0,
        resizeEnabled: false,
        resizeMode: 'longEdge',
        resizeValue: 4096,
        namingTemplate: '{name}',
        suffix: '_print',
        watermarkEnabled: false,
        keepMetadata: true,
        colorSpace: 'original'
    }
]

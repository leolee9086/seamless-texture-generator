/**
 * 多图片批量处理 - 项目数据模型
 *
 * 定义图片项目的元数据和参数快照结构，用于持久化存储和状态管理。
 *
 * @模块职责
 * - 定义 ImageProject (图片项目元数据)
 * - 定义 ProjectParams (调整参数快照)
 * - 定义导出相关的类型
 */

import type { HSLAdjustmentLayer } from '../composables/useAdjustmentParams.types'
import type { DehazeParams } from '../adjustments/dehaze/types'
import type { ClarityParams } from '../adjustments/clarity'
import type { LuminanceAdjustmentParams } from '../adjustments/luminance'

// ============================================================================
// 项目参数快照
// ============================================================================

/**
 * 调整参数快照
 *
 * 与 useAdjustmentParams 返回值对应，但使用普通对象而非 Ref
 * 用于持久化存储到 IndexedDB
 */
export interface ProjectParams {
    /** 全局 HSL 调整 */
    globalHSL: { hue: number; saturation: number; lightness: number }
    /** HSL 调整层 */
    hslLayers: HSLAdjustmentLayer[]
    /** 曝光强度 (自动模式使用) */
    exposureStrength: number
    /** 手动曝光参数 */
    exposureManual: { exposure: number; contrast: number; gamma: number }
    /** 去雾参数 */
    dehazeParams: DehazeParams
    /** 清晰度参数 */
    clarityParams: ClarityParams
    /** 亮度调整参数 */
    luminanceParams: LuminanceAdjustmentParams
    /** 边框尺寸 */
    borderSize: number
    /** 最大分辨率 */
    maxResolution: number
}

// ============================================================================
// 图片项目元数据
// ============================================================================

/**
 * 图片项目元数据
 *
 * 存储路径: projects/{id}
 * 资产路径: assets/{id}_original, assets/{id}_thumb
 */
export interface ImageProject {
    /** 唯一标识符 (UUID) */
    id: string
    /** 文件名 (用于导出时的命名，不含扩展名) */
    name: string
    /** 原始文件名 (含扩展名，用于显示) */
    originalFileName?: string
    /** 创建时间戳 */
    createdAt: number
    /** 最后修改时间戳 */
    updatedAt: number
    /** 原图在 assets store 中的路径 */
    originalPath: string  // 格式: assets/{id}_original
    /** 缩略图在 assets store 中的路径 */
    thumbnailPath: string // 格式: assets/{id}_thumb
    /** 调整参数快照 */
    params: ProjectParams
    /** 图片宽度 (用于 UI 显示) */
    width?: number
    /** 图片高度 (用于 UI 显示) */
    height?: number
    /** 文件大小 (字节，用于 UI 显示) */
    fileSize?: number
    /** 原始 MIME 类型 */
    mimeType?: string
}

// ============================================================================
// 导出预设
// ============================================================================

/** 导出格式 */
export type ExportFormat = 'webp' | 'png' | 'jpeg'

/** 尺寸调整模式 */
export type ResizeMode = 'longEdge' | 'shortEdge' | 'width' | 'height' | 'percentage'

/**
 * 导出预设配置
 *
 * 用户可创建多个预设，批量导出时选择应用
 */
export interface ExportPreset {
    /** 预设名称 */
    name: string
    /** 预设 ID */
    id: string
    /** 是否为内置预设 (内置预设不可删除/编辑) */
    isBuiltIn?: boolean

    // === 文件格式 ===
    /** 输出格式 */
    format: ExportFormat
    /** JPEG/WebP 质量 (1-100) */
    quality: number

    // === 尺寸调整 ===
    /** 是否调整尺寸 */
    resizeEnabled: boolean
    /** 调整模式 */
    resizeMode: ResizeMode
    /** 目标尺寸 (像素或百分比) */
    resizeValue: number

    // === 文件命名 ===
    /**
     * 命名模板
     * 支持变量: {name} (原文件名), {index} (序号), {date} (日期)
     */
    namingTemplate: string
    /** 后缀 (如 _seamless) */
    suffix: string

    // === 高级 ===
    /** 是否保留元数据 */
    keepMetadata: boolean
    /** 色彩空间 */
    colorSpace: 'sRGB' | 'original'
}

// ============================================================================
// 导出任务
// ============================================================================

/** 导出任务状态 */
export type ExportTaskStatus = 'pending' | 'processing' | 'done' | 'error' | 'cancelled'

/**
 * 导出任务
 */
export interface ExportTask {
    /** 项目 ID */
    projectId: string
    /** 项目名称 (用于显示) */
    projectName: string
    /** 任务状态 */
    status: ExportTaskStatus
    /** 处理结果 (Blob) */
    result?: Blob
    /** 错误信息 */
    error?: Error
    /** 处理开始时间 (用于计算预估时间) */
    startTime?: number
    /** 处理完成时间 */
    endTime?: number
}

/** 导出模式 */
export type ExportMode = 'individual' | 'zip'

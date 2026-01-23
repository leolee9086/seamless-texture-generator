/**
 * types 模块的导入转发文件
 * 用于转发来自其他模块的类型，避免直接使用 ../ 导入
 */

// 调整参数类型
import type { HSLAdjustmentLayer } from '../composables/useAdjustmentParams.types'
import type { DehazeParams } from '../adjustments/dehaze/types'
import type { ClarityParams } from '../adjustments/clarity'
import type { LuminanceAdjustmentParams } from '../adjustments/luminance'
import type { 水印配置 } from '../components/control-panels/watermark/watermark.types'

import type { CLAHEConfig } from '../adjustments/exposure/exposureAdjustment.types'

export type {
    HSLAdjustmentLayer,
    DehazeParams,
    ClarityParams,
    LuminanceAdjustmentParams,
    水印配置,
    CLAHEConfig
}

/**
 * utils 目录的统一导入转发文件
 * 用于转发来自父级目录的类型，避免直接使用 ../ 导入
 */
// @AIDONE 已完成的迁移:
// - common-utils: scroll.ts, scroll.guard.ts, vconsole.ts, common.guard.ts, deviceDetection.ts
// - app-utils: imageHandlers.ts, imageHandlers.guard.ts

// @AITODO 继续整理 utils 目录:
// 1. 迁移更多 common-utils 文件: vue/ 目录 (需评估是否与业务解耦)
// 2. 迁移 app-utils 文件: geometry.ts, homography.ts, imageLoader.ts, imageWatcher.ts, download.ts 等
// 注意：几何相关功能需要评估是否是 APP 功能领域高度相关的
// 3. 更新所有外部引用路径
// 这是一个长期任务,可以在完成一部分之后分别更新DONE和TODO注释块标记进度

// 类型导入转发 - 仅来自父级目录
import type { ImageDownloadParams } from '../types/download.types'
import type { ControlEvent } from '../types/controlEvents'
import type { PipelineData, baseOptions, GeneralSynthesisPipelineStep } from '../types/PipelineData.type'
import type { DehazeParams } from '../adjustments/dehaze/types'
import type { ClarityParams } from '../adjustments/clarity'
import type { LuminanceAdjustmentParams } from '../utils/webgpu/luminance.types'
import type { HSLAdjustmentLayer } from '../adjustments/hsl/hslAdjust.utils'

// 类导入转发 - 来自父级目录
import { IndexDBFS } from '../infra/IndexDBFS.class'

// 外部依赖导入转发
import { z } from 'zod'
import type { Component } from 'vue'

export type { ImageDownloadParams, ControlEvent, PipelineData, baseOptions, GeneralSynthesisPipelineStep, DehazeParams, ClarityParams, LuminanceAdjustmentParams, HSLAdjustmentLayer, Component }
export { z, IndexDBFS }
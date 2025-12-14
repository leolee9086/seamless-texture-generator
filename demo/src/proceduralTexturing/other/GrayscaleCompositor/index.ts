/**
 * 灰度蒙版合成器
 * 用于基于灰度蒙版将两个图片进行精细混合
 */

export { grayscaleCompositorWGSL } from './compositor.code'
export type {
    GrayscaleCompositorParams,
    CompositeWithMaskParams,
    LoadAndResizeImagesParams,
    CreateTexturesParams,
    ExecuteComputeShaderParams,
    BufferToDataURLParams,
    CleanupGPUResourcesParams,
    CreateComputePipelineParams
} from './types'

export {
    compositeWithMask,
    defaultCompositorParams,
    compositorPresets
} from './compositorGenerator'

/**
 * @AIDONE 实现这个合成器的高阶版本
 * 已在 ../AdvancedGrayscaleCompositor 中实现
 * 支持:
 * 1. 复用 HSL 色彩分析逻辑 (Ported to WGSL)
 * 2. 基于 mask 的精细合成
 * 3. 多色块范围调节 (Multi-layer support)
 * 4. 可视化调节支持 (via GPU preview)
 * 5. 混合模式调节 (Add, Multiply, Max, Min, Replace)
 * 6. 不透明度调节
 * 7. 高性能实现 (WebGPU Compute Shader)
 */
import { AdvancedCompositor } from './imports'
export { AdvancedCompositor }
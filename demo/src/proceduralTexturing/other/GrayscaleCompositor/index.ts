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

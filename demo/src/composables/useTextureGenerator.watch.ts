import { watch } from './imports'


import type { TextureWatchersContext } from './useTextureGenerator.types'

/**
 * 设置纹理生成器的响应式监听
 * 
 * 负责在状态变化时自动触发图像处理
 */
export function setupTextureWatchers(ctx: TextureWatchersContext): void {
    const { state, adjustmentParams, lutControl, enableWatermark, watermarkConfig, debouncedProcessImage } = ctx
    // 1. 监听原始图像变化 (如切换项目)
    watch(state.originalImage, (newVal) => {
        // 切换图片时，立即清空旧的处理结果，避免显示不匹配的纹理
        state.processedImage.value = null
        if (newVal) {
            debouncedProcessImage()
        }
    })

    // 2. 监听参数变化 (确保项目切换或批量应用参数时自动更新)
    watch([
        state.borderSize,
        adjustmentParams.exposureStrength,
        adjustmentParams.exposureManual,
        adjustmentParams.dehazeParams,
        adjustmentParams.clarityParams,
        adjustmentParams.luminanceParams,
        adjustmentParams.globalHSL,
        adjustmentParams.hslLayers,
        lutControl.lutIntensity,
        lutControl.lutFile,
        enableWatermark,
        watermarkConfig
    ], () => {
        if (state.originalImage.value) {
            debouncedProcessImage()
        }
    }, { deep: true })
}

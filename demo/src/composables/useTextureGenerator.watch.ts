import { watch } from './imports'
import { useCanvasModeManager } from './canvas-mode/index'

import type { TextureWatchersContext } from './useTextureGenerator.types'

/**
 * 设置纹理生成器的响应式监听
 *
 * 负责在状态变化时自动触发图像处理
 */
export function setupTextureWatchers(ctx: TextureWatchersContext): void {
    const { state, adjustmentParams, lutControl, enableWatermark, watermarkConfig, debouncedProcessImage } = ctx
    const canvasModeManager = useCanvasModeManager()
    
    /**
     * @简洁函数 谓词函数，判断是否应该触发效果计算
     * 检查是否应该触发效果计算
     * 在程序化模式下，不应该触发项目效果计算
     */
    const shouldProcessEffects = (): boolean => {
        const currentMode = canvasModeManager.activeModeId.value
        // 使用字符串字面量而不是导入常量，避免值导入
        return currentMode !== 'procedural'
    }
    
    // 1. 监听原始图像变化 (如切换项目)
    watch(state.originalImage, (newVal) => {
        // 切换图片时，立即清空旧的处理结果，避免显示不匹配的纹理
        state.processedImage.value = null
        if (newVal && shouldProcessEffects()) {
            debouncedProcessImage()
        }
    })

    // 2. 监听参数变化 (确保项目切换或批量应用参数时自动更新)
    // 注意：在程序化模式下，这些参数变化不应该触发效果计算
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
        if (state.originalImage.value && shouldProcessEffects()) {
            debouncedProcessImage()
        }
    }, { deep: true })
}

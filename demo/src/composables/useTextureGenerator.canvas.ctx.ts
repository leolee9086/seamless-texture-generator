/**
 * useTextureGenerator - 画布模式集成上下文
 * 
 * 处理纹理生成器与画布模式管理器的集成
 */

import { watch } from './imports'
import type { Ref } from './imports'
import { useCanvasModeManager } from './canvas-mode/index'
import { CANVAS_MODE_IDS } from './canvas-mode/constants'
import { isProjectModeInstance } from './useTextureGenerator.guard'

/**
 * 同步处理结果到画布模式管理器
 * 
 * 当处理管线生成新的处理结果时,将其同步到当前激活的画布模式
 */
export function 同步处理结果到画布模式(processedImage: Ref<string | null>): void {
    const canvasModeManager = useCanvasModeManager()
    
    // 监听处理结果的变化
    watch(
        processedImage,
        (newProcessedImage) => {
            // 卫语句：只在项目模式下同步处理结果
            if (canvasModeManager.activeModeId.value !== CANVAS_MODE_IDS.PROJECT) {
                return
            }
            
            // 卫语句：确保当前模式实例存在
            const currentMode = canvasModeManager.activeMode.value
            if (!currentMode) {
                return
            }
            
            // 卫语句：确保是项目模式实例（使用类型守卫）
            if (!isProjectModeInstance(currentMode)) {
                return
            }
            
            // 同步处理结果到项目模式
            currentMode.setProcessedImage(newProcessedImage)
        },
        { immediate: true }
    )
}

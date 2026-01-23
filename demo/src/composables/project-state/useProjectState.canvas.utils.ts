/**
 * 项目状态管理 - 画布模式工具函数
 * 
 * 处理项目切换时的画布模式同步
 */

import { useCanvasModeManager, CANVAS_MODE_IDS } from './imports'

/**
 * 确保当前处于项目模式
 * 
 * 如果当前不是项目模式，自动切换回项目模式
 */
export async function 确保项目模式(): Promise<void> {
    const canvasModeManager = useCanvasModeManager()
    
    // 卫语句：如果已经是项目模式，无需切换
    if (canvasModeManager.activeModeId.value === CANVAS_MODE_IDS.PROJECT) {
        return
    }
    
    // 切换到项目模式
    await canvasModeManager.switchMode(CANVAS_MODE_IDS.PROJECT)
}

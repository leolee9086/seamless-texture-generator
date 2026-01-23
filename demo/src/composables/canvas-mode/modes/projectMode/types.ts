/**
 * 项目模式 - 类型定义
 */

import type { CanvasMode } from '../../types'

/**
 * 项目模式实例接口
 * 扩展 CanvasMode 接口，添加项目模式特有的方法
 */
export interface ProjectModeInstance extends CanvasMode {
    /** 设置处理后的图像 */
    setProcessedImage(imageDataUrl: string | null): void
}

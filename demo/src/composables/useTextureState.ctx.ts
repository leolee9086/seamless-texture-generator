import { computed } from './imports'
import type { WritableComputedRef } from './imports'
import { dataURLToBlob } from './project-state/useProjectState.utils'
import { 生成上传文件名, LOG_MESSAGES } from './useTextureState.templates'
import { 未知模式标识 } from './useTextureState.constants'
import type { ProjectStateReturn } from './project-state/useProjectState.types'
import type { ProjectParams } from './project-state/imports'
import { useCanvasModeManager } from './canvas-mode/index'
import { CANVAS_MODE_IDS } from './canvas-mode/constants'
import { isStringOrNull } from './useTextureState.guard'

/**
 * 获取程序化纹理模式的图像
 */
function 获取程序化纹理图像(
    canvasModeManager: ReturnType<typeof useCanvasModeManager>
): string | null {
    const output = canvasModeManager.canvasOutput.value
    const displayImage = output.displayImage
    
    // 卫语句：使用类型守卫确保类型安全
    if (!isStringOrNull(displayImage)) {
        return null
    }
    
    return displayImage
}

/**
 * 获取当前画布模式的图像源
 */
function 获取画布模式图像源(
    canvasModeManager: ReturnType<typeof useCanvasModeManager>,
    projectState: ProjectStateReturn
): string | null {
    const currentMode = canvasModeManager.activeModeId.value
    
    // 卫语句：如果是程序化纹理模式，返回程序化模式的输出
    if (currentMode === CANVAS_MODE_IDS.PROCEDURAL) {
        return 获取程序化纹理图像(canvasModeManager)
    }
    
    // 默认返回项目的原始图像
    return projectState.state.activeOriginalDataUrl.value
}

/**
 * 处理图像上传（仅在项目模式下创建项目）
 */
function 处理图像上传(
    dataUrl: string,
    currentMode: string | null,
    projectState: ProjectStateReturn
): void {
    // 卫语句：只有在项目模式下才创建新项目
    if (currentMode !== CANVAS_MODE_IDS.PROJECT) {
        console.warn(LOG_MESSAGES.NOT_IN_PROJECT_MODE(currentMode || 未知模式标识))
        return
    }
    
    // 上传新图时，创建新项目
    const blob = dataURLToBlob(dataUrl)
    const file = new File([blob], 生成上传文件名(Date.now()), { type: blob.type })
    projectState.actions.createProject(file)
}

/**
 * 创建原图代理
 *
 * 连接本地 rawOriginalImage 与项目状态 activeOriginalDataUrl
 * 处理图片上传逻辑
 *
 * 注意：只有在项目模式下才会创建新项目，避免程序化纹理模式下的项目记录爆炸
 */
export function 创建原图代理(projectState: ProjectStateReturn): WritableComputedRef<string | null> {
    const canvasModeManager = useCanvasModeManager()
    
    return computed({
        /** @简洁函数 getter 简单地返回当前画布模式的图像源 */
        get: () => 获取画布模式图像源(canvasModeManager, projectState),
        set: (dataUrl: string | null) => {
            // 卫语句：如果为空，目前不做操作
            if (!dataUrl) return

            // 卫语句：必须是 data: 协议
            if (!dataUrl.startsWith('data:')) return

            // 检查当前画布模式并处理上传
            const currentMode = canvasModeManager.activeModeId.value
            处理图像上传(dataUrl, currentMode, projectState)
        }
    })
}

/**
 * 创建参数代理
 * 
 * 连接本地参数与项目参数
 */
export function 创建参数代理<K extends keyof ProjectParams>(
    projectState: ProjectStateReturn,
    paramName: K,
    defaultValue: ProjectParams[K]
): WritableComputedRef<ProjectParams[K]> {
    return computed({
        get: () => projectState.state.activeProject.value?.params[paramName] ?? defaultValue,
        /** @简洁函数 setter 简单地更新参数 */
        set: (val: ProjectParams[K]) => {
            if (!projectState.state.activeProject.value) return
            projectState.actions.updateProjectParams({ [paramName]: val })
        }
    })
}

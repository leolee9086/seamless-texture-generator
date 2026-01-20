import { computed } from './imports'
import type { ComputedRef } from './imports'
import { dataURLToBlob } from './project-state/useProjectState.utils'
import { 生成上传文件名 } from './useTextureState.templates'
import type { ProjectStateReturn } from './project-state/useProjectState.types'
import type { ProjectParams } from './project-state/imports'

/**
 * 创建原图代理
 * 
 * 连接本地 rawOriginalImage 与项目状态 activeOriginalDataUrl
 * 处理图片上传逻辑
 */
export function 创建原图代理(projectState: ProjectStateReturn): ComputedRef<string | null> {
    return computed({
        get: () => projectState.state.activeOriginalDataUrl.value,
        set: (dataUrl: string | null) => {
            // 卫语句：如果为空，目前不做操作
            if (!dataUrl) return

            // 卫语句：必须是 data: 协议
            if (!dataUrl.startsWith('data:')) return

            // 上传新图时，创建新项目
            const blob = dataURLToBlob(dataUrl)
            const file = new File([blob], 生成上传文件名(Date.now()), { type: blob.type })
            projectState.actions.createProject(file)
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
): ComputedRef<ProjectParams[K]> {
    return computed({
        get: () => projectState.state.activeProject.value?.params[paramName] ?? defaultValue,
        /** @简洁函数 setter 简单地更新参数 */
        set: (val: ProjectParams[K]) => {
            if (!projectState.state.activeProject.value) return
            projectState.actions.updateProjectParams({ [paramName]: val })
        }
    })
}

/**
 * ProceduralTabContent 类型定义
 */

import type { Ref, ComputedRef } from './imports'

/**
 * 程序化纹理面板状态
 */
export interface ProceduralTabContentState {
    /** 是否正在保存 */
    isSaving: Ref<boolean>
    /** 是否可以保存为项目 */
    canSaveAsProject: ComputedRef<boolean>
    /** 保存按钮样式 */
    saveButtonClass: ComputedRef<string>
}

/**
 * 保存为项目的函数类型
 */
export type SaveAsProjectFn = () => Promise<void>

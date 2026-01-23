/**
 * 程序化纹理模式 (Procedural Mode)
 *
 * 用于实时预览和调整程序化纹理生成参数
 * 不会自动创建项目，只在用户确认时才持久化
 */

import { ref, useProjectState } from './imports'
import { CANVAS_MODE_IDS, MODE_DISPLAY_NAMES } from './imports'
import type { ProceduralModeInstance } from './types'
import { createGetOutputMethod, createPersistMethod } from './factory.utils'
import { LOG_MESSAGES } from './constants'

/**
 * 创建程序化纹理模式实例
 */
export function createProceduralMode(): ProceduralModeInstance {
    const isDirty = ref(false)
    const outputVersion = ref(0)
    const { actions: projectActions } = useProjectState()
    
    // 当前生成的纹理
    let currentTextureDataUrl: string | null = null

    /** @简洁函数 获取当前纹理的 getter */
    const getCurrentTexture = (): string | null => currentTextureDataUrl

    return {
        id: CANVAS_MODE_IDS.PROCEDURAL,
        displayName: MODE_DISPLAY_NAMES.PROCEDURAL,
        persistStrategy: 'confirm',
        isDirty,
        outputVersion,

        async onEnter(): Promise<void> {
            isDirty.value = false
            console.warn(LOG_MESSAGES.ENTER_MODE)
        },

        /** @简洁函数 退出时清理临时数据 */
        async onExit(): Promise<void> {
            currentTextureDataUrl = null
            isDirty.value = false
            outputVersion.value = 0
        },

        getOutput: createGetOutputMethod(getCurrentTexture, isDirty, outputVersion),
        persist: createPersistMethod(getCurrentTexture, projectActions, isDirty),

        /** @简洁函数 占位实现，实际由外部提供生成器 */
        async updateTexture(): Promise<void> {
            console.warn(LOG_MESSAGES.UPDATE_TEXTURE_PLACEHOLDER)
            isDirty.value = true
            outputVersion.value++
        },

        /** @简洁函数 获取当前生成的纹理 */
        getCurrentTexture(): string | null {
            return currentTextureDataUrl
        },

        /** @简洁函数 设置当前生成的纹理 */
        setCurrentTexture(dataUrl: string | null): void {
            currentTextureDataUrl = dataUrl
            isDirty.value = true
            outputVersion.value++
        },
    }
}

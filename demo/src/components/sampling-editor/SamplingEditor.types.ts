import type { Ref } from './imports'

export interface SamplingEditorProps {
    visible: boolean
    originalImage: string | null
}

export interface SamplingEditorEmit {
    (e: 'close'): void
    (e: 'confirm', imageData: string): void
}

/** 采样编辑器 Actions 上下文 */
export interface SamplingEditorActionsContext {
    imageObj: Ref<HTMLImageElement | null>
    points: Ref<{ x: number; y: number }[]>
    emit: SamplingEditorEmit
    isProcessing: Ref<boolean>
}

/** 采样编辑器 Actions 返回类型 */
export interface SamplingEditorActionsReturn {
    confirm: () => Promise<void>
    cancel: () => void
}

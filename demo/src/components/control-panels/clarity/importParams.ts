import type { ClarityParams, ControlEvent, Ref } from './imports'
import { DEFAULT_CLARITY_PARAMS, createClarityAdjustmentEvent } from './imports'
import { isHTMLInputElement, isFileReaderResultString } from './importParams.guard'

/**
 * 导入清晰度参数
 * @param clarityParamsRef 清晰度参数的响应式引用
 * @param currentPresetRef 当前预设的响应式引用
 * @param emit 事件发射器
 */
export const importParams = (
    clarityParamsRef: Ref<ClarityParams>,
    currentPresetRef: Ref<string | null>,
    emit: (event: 'controlEvent', data: ControlEvent) => void
): void => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (event: Event): void => {
        const target = event.target
        if (!isHTMLInputElement(target)) {
            return
        }
        
        const file = target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (e: ProgressEvent<FileReader>): void => {
                try {
                    if (!isFileReaderResultString(e.target?.result)) {
                        throw new Error('FileReader result is not a string')
                    }
                    
                    const importedParams = JSON.parse(e.target.result)
                    clarityParamsRef.value = { ...DEFAULT_CLARITY_PARAMS, ...importedParams }
                    currentPresetRef.value = null
                    emit('controlEvent', createClarityAdjustmentEvent(clarityParamsRef.value))
                } catch (error) {
                    console.error('导入参数失败:', error)
                    alert('导入参数失败，请检查文件格式')
                }
            }
            reader.readAsText(file)
        }
    }
    input.click()
}
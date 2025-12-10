import type { ClarityParams, ControlEvent, Ref } from './imports'
import { CLARITY_PRESETS } from './imports'
import { useClarityPanelState } from './clarityPanel.ctx'
import {
    handleParamUpdate,
    resetParams,
    applyPreset,
    handleImportParams,
    handleExportParams
} from './clarityPanel.utils'

/**
 * 清晰度面板的 Composable
 * @param emit 事件发射器
 * @returns 清晰度面板的状态和方法
 */
export function useClarityPanel(
    emit: (event: 'controlEvent', data: ControlEvent) => void
): {
    clarityParams: Ref<ClarityParams>
    currentPreset: Ref<string | null>
    emptyStateClass: (isMobile: boolean) => string
    contentContainerClass: (isMobile: boolean) => string
    handleParamUpdate: (data: { id: string; value: number }) => void
    resetParams: () => void
    applyPreset: (presetKey: keyof typeof CLARITY_PRESETS) => void
    handleImportParams: () => void
    handleExportParams: () => void
} {
    // 获取状态和上下文
    const { clarityParams, currentPreset, ctx, emptyStateClass, contentContainerClass } = 
        useClarityPanelState(emit)

    // Methods
    const handleParamUpdateWrapper = (data: { id: string; value: number }): void => {
        handleParamUpdate(ctx, data)
    }

    const resetParamsWrapper = (): void => {
        resetParams(ctx)
    }

    const applyPresetWrapper = (presetKey: keyof typeof CLARITY_PRESETS): void => {
        applyPreset(ctx, presetKey)
    }

    const handleImportParamsWrapper = (): void => {
        handleImportParams(ctx)
    }

    const handleExportParamsWrapper = (): void => {
        handleExportParams(ctx)
    }

    return {
        // State
        clarityParams,
        currentPreset,
        
        // Computed
        emptyStateClass,
        contentContainerClass,
        
        // Methods
        handleParamUpdate: handleParamUpdateWrapper,
        resetParams: resetParamsWrapper,
        applyPreset: applyPresetWrapper,
        handleImportParams: handleImportParamsWrapper,
        handleExportParams: handleExportParamsWrapper
    }
}
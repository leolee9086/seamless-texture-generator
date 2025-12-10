import type { DehazeParams, ControlEvent, DehazePreset, Ref } from './imports'
import { DEHAZE_PRESETS } from './imports'
import { useDehazePanelState } from './dehazePanel.ctx'
import {
    handleBasicSliderUpdate,
    handleAdvancedSliderUpdate,
    handleEnhancementSliderUpdate,
    applyPreset,
    resetDehaze
} from './dehazePanel.utils'

/**
 * 去雾面板的 Composable
 * @param emit 事件发射器
 * @returns 去雾面板的状态和方法
 */
export function useDehazePanel(
    emit: (event: 'controlEvent', data: ControlEvent) => void
): {
    dehazeParams: Ref<DehazeParams>
    currentPreset: Ref<DehazePreset | null>
    showAdvanced: Ref<boolean>
    isProcessing: Ref<boolean>
    hasAdjustments: Ref<boolean>
    emptyStateClass: (isMobile: boolean) => string
    contentContainerClass: (isMobile: boolean) => string
    handleBasicSliderUpdate: (data: { id: string; value: number }) => void
    handleAdvancedSliderUpdate: (data: { id: string; value: number }) => void
    handleEnhancementSliderUpdate: (data: { id: string; value: number }) => void
    applyPreset: (presetKey: keyof typeof DEHAZE_PRESETS) => void
    resetDehaze: () => void
} {
    // 获取状态和上下文
    const {
        dehazeParams,
        currentPreset,
        showAdvanced,
        isProcessing,
        ctx,
        emptyStateClass,
        contentContainerClass,
        hasAdjustments
    } = useDehazePanelState(emit)

    return {
        // State
        dehazeParams,
        currentPreset,
        showAdvanced,
        isProcessing,
        hasAdjustments,

        // Computed
        emptyStateClass,
        contentContainerClass,

        // Methods
        handleBasicSliderUpdate: (data) => handleBasicSliderUpdate(ctx, data),
        handleAdvancedSliderUpdate: (data) => handleAdvancedSliderUpdate(ctx, data),
        handleEnhancementSliderUpdate: (data) => handleEnhancementSliderUpdate(ctx, data),
        applyPreset: (presetKey) => applyPreset(ctx, presetKey),
        resetDehaze: () => resetDehaze(ctx)
    }
}
import { ref, computed } from './imports'
import type { DehazeParams, ControlEvent, Ref, DehazePreset } from './imports'
import { DEFAULT_DEHAZE_PARAMS } from './imports'
import type { DehazePanelContext } from './dehazePanel.types'

/**
 * 创建去雾面板的状态和上下文
 * @param emit 事件发射器
 * @returns 去雾面板的状态和上下文
 */
export function useDehazePanelState(
    emit: (event: 'controlEvent', data: ControlEvent) => void
): {
    dehazeParams: Ref<DehazeParams>
    currentPreset: Ref<DehazePreset | null>
    showAdvanced: Ref<boolean>
    isProcessing: Ref<boolean>
    ctx: DehazePanelContext
    emptyStateClass: (isMobile: boolean) => string
    contentContainerClass: (isMobile: boolean) => string
    hasAdjustments: Ref<boolean>
} {
    // State
    const dehazeParams = ref<DehazeParams>({ ...DEFAULT_DEHAZE_PARAMS })
    const currentPreset = ref<DehazePreset | null>(null)
    const showAdvanced = ref(false)
    const isProcessing = ref(false)

    // 创建上下文
    const ctx: DehazePanelContext = {
        dehazeParams,
        currentPreset,
        showAdvanced,
        isProcessing,
        emit
    }

    // Computed
    const emptyStateClass = computed(() =>
        (isMobile: boolean): string =>
            isMobile
                ? 'text-center text-white/30 py-8 text-sm'
                : 'flex flex-col items-center justify-center py-12 text-white/30 gap-4'
    )

    const contentContainerClass = computed(() =>
        (isMobile: boolean): string =>
            isMobile
                ? 'flex flex-col gap-3'
                : 'flex flex-col gap-3 bg-white/5 rounded-2xl border border-white/5'
    )

    const hasAdjustments = computed(() => {
        return JSON.stringify(dehazeParams.value) !== JSON.stringify(DEFAULT_DEHAZE_PARAMS)
    })

    return {
        dehazeParams,
        currentPreset,
        showAdvanced,
        isProcessing,
        ctx,
        emptyStateClass: emptyStateClass.value,
        contentContainerClass: contentContainerClass.value,
        hasAdjustments
    }
}
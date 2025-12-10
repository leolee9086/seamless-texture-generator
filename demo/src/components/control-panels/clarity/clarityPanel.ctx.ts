import { ref, computed } from './imports'
import type { ClarityParams, ControlEvent, Ref } from './imports'
import { DEFAULT_CLARITY_PARAMS } from './imports'
import type { ClarityPanelContext } from './clarityPanel.types'

/**
 * 创建清晰度面板的状态和上下文
 * @param emit 事件发射器
 * @returns 清晰度面板的状态和上下文
 */
export function useClarityPanelState(
    emit: (event: 'controlEvent', data: ControlEvent) => void
): {
    clarityParams: Ref<ClarityParams>
    currentPreset: Ref<string | null>
    ctx: ClarityPanelContext
    emptyStateClass: (isMobile: boolean) => string
    contentContainerClass: (isMobile: boolean) => string
} {
    // State
    const clarityParams = ref<ClarityParams>({ ...DEFAULT_CLARITY_PARAMS })
    const currentPreset = ref<string | null>(null)

    // 创建上下文
    const ctx: ClarityPanelContext = {
        clarityParams,
        currentPreset,
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

    return {
        clarityParams,
        currentPreset,
        ctx,
        emptyStateClass: emptyStateClass.value,
        contentContainerClass: contentContainerClass.value
    }
}
import { ref, computed } from './imports'
import type { DehazeParams, ControlEvent, Ref, DehazePreset } from './imports'
import { DEFAULT_DEHAZE_PARAMS } from './imports'
import type { DehazePanelContext, DehazePanelState } from './dehazePanel.types'
import {
    EMPTY_STATE_MOBILE_CLASS,
    EMPTY_STATE_DESKTOP_CLASS,
    CONTENT_CONTAINER_MOBILE_CLASS,
    CONTENT_CONTAINER_DESKTOP_CLASS
} from './dehazePanel.constants'

/**
 * 创建去雾面板的状态
 * @returns 去雾面板的状态
 */
function createDehazePanelState(): DehazePanelState {
    const dehazeParams = ref<DehazeParams>({ ...DEFAULT_DEHAZE_PARAMS })
    const currentPreset = ref<DehazePreset | null>(null)
    const showAdvanced = ref(false)
    const isProcessing = ref(false)

    return {
        dehazeParams,
        currentPreset,
        showAdvanced,
        isProcessing
    }
}

/**
 * 创建去雾面板的计算属性
 * @param dehazeParams 去雾参数
 * @returns 计算属性
 */
function createDehazePanelComputed(dehazeParams: Ref<DehazeParams>): {
    emptyStateClass: (isMobile: boolean) => string
    contentContainerClass: (isMobile: boolean) => string
    hasAdjustments: Ref<boolean>
} {
    const emptyStateClass = computed(() =>
        (isMobile: boolean): string =>
            isMobile
                ? EMPTY_STATE_MOBILE_CLASS
                : EMPTY_STATE_DESKTOP_CLASS
    )

    const contentContainerClass = computed(() =>
        (isMobile: boolean): string =>
            isMobile
                ? CONTENT_CONTAINER_MOBILE_CLASS
                : CONTENT_CONTAINER_DESKTOP_CLASS
    )

    const hasAdjustments = computed(() => {
        return JSON.stringify(dehazeParams.value) !== JSON.stringify(DEFAULT_DEHAZE_PARAMS)
    })

    return {
        emptyStateClass: emptyStateClass.value,
        contentContainerClass: contentContainerClass.value,
        hasAdjustments
    }
}

/**
 * 创建去雾面板的上下文
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
    // 创建状态
    const state = createDehazePanelState()

    // 创建上下文
    const ctx: DehazePanelContext = {
        ...state,
        emit
    }

    // 创建计算属性
    const computedProps = createDehazePanelComputed(state.dehazeParams)

    return {
        ...state,
        ctx,
        ...computedProps
    }
}
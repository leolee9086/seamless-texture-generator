import { onMounted, onUnmounted, type Ref } from './imports'

export function useSamplingEditorViewLifecycle(
    containerRef: Ref<HTMLElement | null>,
    stageConfig: Ref<{ width: number, height: number }>
) {
    const updateStageSize = () => {
        if (containerRef.value) {
            stageConfig.value.width = containerRef.value.clientWidth
            stageConfig.value.height = containerRef.value.clientHeight
        }
    }

    let resizeObserver: ResizeObserver | null = null
    onMounted(() => {
        if (containerRef.value) {
            resizeObserver = new ResizeObserver(() => {
                updateStageSize()
            })
            resizeObserver.observe(containerRef.value)

            // Initial size update
            updateStageSize()
        }
    })

    onUnmounted(() => {
        if (resizeObserver) {
            resizeObserver.disconnect()
            resizeObserver = null
        }
    })

    return {
        updateStageSize
    }
}

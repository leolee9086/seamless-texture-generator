import { computed, Ref } from 'vue'

export function useSamplingEditorViewConfig(
    imageObj: Ref<HTMLImageElement | null>,
    groupConfig: Ref<{ scaleX: number }>,
    lineConfig: Ref<any>,
    rotationLineConfig: Ref<any>,
    rotationHandleConfig: Ref<any>
) {
    const imageConfig = computed(() => ({
        image: imageObj.value,
        width: imageObj.value?.width,
        height: imageObj.value?.height
    }))

    const lineConfigWithScale = computed(() => {
        const config = lineConfig.value
        if (!config.points) return config
        return {
            ...config,
            strokeWidth: 2 / groupConfig.value.scaleX
        }
    })

    const rotationLineConfigWithScale = computed(() => {
        const config = rotationLineConfig.value
        if (config.visible === false) return config
        return {
            ...config,
            strokeWidth: 1 / groupConfig.value.scaleX
        }
    })

    const rotationHandleConfigWithScale = computed(() => {
        const config = rotationHandleConfig.value
        if (config.visible === false) return config
        return {
            ...config,
            radius: 8 / groupConfig.value.scaleX,
            strokeWidth: 1 / groupConfig.value.scaleX,
            hitStrokeWidth: 20 / groupConfig.value.scaleX
        }
    })

    return {
        imageConfig,
        lineConfigWithScale,
        rotationLineConfigWithScale,
        rotationHandleConfigWithScale
    }
}

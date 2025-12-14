import { ref } from './imports'

export function useSamplingEditorState() {
    const containerRef = ref<HTMLDivElement | null>(null)
    const stageRef = ref<any>(null)
    const contentGroupRef = ref<any>(null)
    const isProcessing = ref(false)
    const imageObj = ref<HTMLImageElement | null>(null)

    // State
    const stageConfig = ref({
        width: typeof window !== 'undefined' ? window.innerWidth : 800,
        height: typeof window !== 'undefined' ? window.innerHeight : 600,
        draggable: true // stage 可拖拽实现平移
    })

    const groupConfig = ref({
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1
    })

    return {
        containerRef,
        stageRef,
        contentGroupRef,
        isProcessing,
        imageObj,
        stageConfig,
        groupConfig
    }
}

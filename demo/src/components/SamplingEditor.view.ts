import { Ref } from 'vue'
import { useSamplingEditorViewConfig } from './SamplingEditor.view.config'
import { useSamplingEditorTouch } from './SamplingEditor.view.touch'
import { useSamplingEditorViewManipulation } from './SamplingEditor.view.manipulation'
import { useSamplingEditorViewLifecycle } from './SamplingEditor.view.lifecycle'

export function useSamplingEditorView(
    containerRef: Ref<HTMLElement | null>,
    stageRef: Ref<any>,
    imageObj: Ref<HTMLImageElement | null>,
    groupConfig: Ref<any>,
    stageConfig: Ref<any>,
    lineConfig: Ref<any>,
    rotationLineConfig: Ref<any>,
    rotationHandleConfig: Ref<any>,
    handlePointDragMove: (e: any, index: number, scale: number) => void,
    resetPoints: () => void
) {
    const { imageConfig, lineConfigWithScale, rotationLineConfigWithScale, rotationHandleConfigWithScale } = useSamplingEditorViewConfig(imageObj, groupConfig, lineConfig, rotationLineConfig, rotationHandleConfig)
    const { handleTouchStart, handleTouchMove, handleTouchEnd } = useSamplingEditorTouch(stageRef)
    const { resetView, handleWheel } = useSamplingEditorViewManipulation(stageRef, containerRef, imageObj, groupConfig)
    const { updateStageSize } = useSamplingEditorViewLifecycle(containerRef, stageConfig)

    const loadImage = (src: string) => {
        const img = new Image()
        img.onload = () => {
            imageObj.value = img
            resetView()
            resetPoints()
        }
        img.src = src
    }

    const handleMouseEnter = (e: any) => e.target.getStage().container().style.cursor = 'pointer'
    const handleMouseLeave = (e: any) => e.target.getStage().container().style.cursor = 'default'
    const handleDragStart = () => { }
    const handleDragEnd = () => { }
    const handlePointDragMoveWithScale = (e: any, index: number) => handlePointDragMove(e, index, groupConfig.value.scaleX)

    return {
        updateStageSize, resetView, loadImage, handleWheel,
        handleTouchStart, handleTouchMove, handleTouchEnd,
        handleMouseEnter, handleMouseLeave, handleDragStart, handleDragEnd,
        imageConfig, lineConfigWithScale, rotationLineConfigWithScale, rotationHandleConfigWithScale,
        handlePointDragMoveWithScale
    }
}

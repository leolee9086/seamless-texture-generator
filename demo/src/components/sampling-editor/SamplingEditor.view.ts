import type { Ref } from './imports'
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
    const { handleTouchStart, handleTouchMove, handleTouchEnd } = useSamplingEditorTouch(stageRef, groupConfig)
    const { resetView, handleWheel } = useSamplingEditorViewManipulation(stageRef, containerRef, imageObj, groupConfig)
    const { updateStageSize } = useSamplingEditorViewLifecycle(containerRef, stageConfig)

    const loadImage = (src: string): void => {
        const img = new Image()
        img.onload = (): void => {
            imageObj.value = img
            resetView()
            resetPoints()
        }
        img.src = src
    }

    const handleMouseEnter = (event: { target: { getStage: () => { container: () => { style: { cursor: string } } } } }): void => { event.target.getStage().container().style.cursor = 'pointer' }
    const handleMouseLeave = (event: { target: { getStage: () => { container: () => { style: { cursor: string } } } } }): void => { event.target.getStage().container().style.cursor = 'default' }
    const handleDragStart = (): void => { /* stage 拖拽开始 */ }
    const handleDragEnd = (): void => { /* stage 拖拽结束 */ }

    const handlePointDragMoveWithScale = (dragEvent: { target: { x: () => number, y: () => number } }, index: number): void => {
        handlePointDragMove(dragEvent, index, groupConfig.value.scaleX)
    }

    return {
        updateStageSize, resetView, loadImage, handleWheel,
        handleTouchStart, handleTouchMove, handleTouchEnd,
        handleMouseEnter, handleMouseLeave, handleDragStart, handleDragEnd,
        imageConfig, lineConfigWithScale, rotationLineConfigWithScale, rotationHandleConfigWithScale,
        handlePointDragMoveWithScale
    }
}


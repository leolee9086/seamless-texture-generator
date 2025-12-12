import { Ref } from 'vue'

export function useSamplingEditorViewManipulation(
    stageRef: Ref<any>,
    containerRef: Ref<HTMLElement | null>,
    imageObj: Ref<HTMLImageElement | null>,
    groupConfig: Ref<{ x: number, y: number, scaleX: number, scaleY: number }>
) {
    const resetView = () => {
        if (!imageObj.value || !containerRef.value) return

        const img = imageObj.value
        const stageW = containerRef.value.clientWidth
        const stageH = containerRef.value.clientHeight

        // Fit image to screen
        const scaleX = stageW / img.width
        const scaleY = stageH / img.height
        const scale = Math.min(scaleX, scaleY) * 0.9

        groupConfig.value = {
            x: (stageW - img.width * scale) / 2,
            y: (stageH - img.height * scale) / 2,
            scaleX: scale,
            scaleY: scale
        }

        // Reset stage position if it was dragged
        if (stageRef.value) {
            const stage = stageRef.value.getStage()
            stage.position({ x: 0, y: 0 })
            stage.batchDraw()
        }
    }

    const handleWheel = (e: any) => {
        const evt = e.evt
        evt.preventDefault()

        const stage = stageRef.value.getStage()
        const oldScale = stage.scaleX()
        const pointer = stage.getPointerPosition()

        const scaleBy = 1.1
        const newScale = evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy

        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale
        }

        const newPos = {
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale
        }

        stage.scale({ x: newScale, y: newScale })
        stage.position(newPos)
        stage.batchDraw()
    }

    return {
        resetView,
        handleWheel
    }
}

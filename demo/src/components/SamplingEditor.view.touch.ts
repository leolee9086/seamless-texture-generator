import { Ref } from 'vue'
import { getDistance, getCenter } from '../utils/geometry'

export function useSamplingEditorTouch(stageRef: Ref<any>) {
    let lastCenter: { x: number, y: number } | null = null
    let lastDist = 0

    const handleTouchStart = (e: any) => {
        const evt = e.evt
        const touches = evt.touches

        if (touches.length === 2) {
            const stage = stageRef.value.getStage()
            stage.stopDrag()

            const p1 = { x: touches[0].clientX, y: touches[0].clientY }
            const p2 = { x: touches[1].clientX, y: touches[1].clientY }

            lastCenter = getCenter(p1, p2)
            lastDist = getDistance(p1, p2)
        }
    }

    const handleTouchMove = (e: any) => {
        const evt = e.evt
        const touches = evt.touches

        if (touches.length === 2 && lastCenter) {
            evt.preventDefault()

            const stage = stageRef.value.getStage()
            const p1 = { x: touches[0].clientX, y: touches[0].clientY }
            const p2 = { x: touches[1].clientX, y: touches[1].clientY }

            const newCenter = getCenter(p1, p2)
            const newDist = getDistance(p1, p2)

            const pointTo = {
                x: (lastCenter.x - stage.x()) / stage.scaleX(),
                y: (lastCenter.y - stage.y()) / stage.scaleX()
            }

            const scale = stage.scaleX() * (newDist / lastDist)

            stage.scale({ x: scale, y: scale })

            const newPos = {
                x: newCenter.x - pointTo.x * scale,
                y: newCenter.y - pointTo.y * scale
            }

            stage.position(newPos)
            stage.batchDraw()

            lastDist = newDist
            lastCenter = newCenter
        }
    }

    const handleTouchEnd = () => {
        lastCenter = null
        lastDist = 0
    }

    return {
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd
    }
}

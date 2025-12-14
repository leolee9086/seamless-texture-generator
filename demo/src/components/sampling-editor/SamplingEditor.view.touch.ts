import type { Ref } from './imports'
import { getDistance, getCenter } from './imports'

export function useSamplingEditorTouch(
    stageRef: Ref<any>,
    groupConfig: Ref<{ x: number, y: number, scaleX: number, scaleY: number, draggable?: boolean }>
) {
    let lastCenter: { x: number, y: number } | null = null
    let lastDist = 0

    const handleTouchStart = (e: any) => {
        const evt = e.evt
        const touches = evt.touches

        if (touches.length === 2) {
            const stage = stageRef.value?.getStage()
            stage?.stopDrag()

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

            const p1 = { x: touches[0].clientX, y: touches[0].clientY }
            const p2 = { x: touches[1].clientX, y: touches[1].clientY }

            const newCenter = getCenter(p1, p2)
            const newDist = getDistance(p1, p2)

            const oldScale = groupConfig.value.scaleX
            const newScale = oldScale * (newDist / lastDist)

            // 计算触摸中心相对于 group 的坐标
            const pointTo = {
                x: (lastCenter.x - groupConfig.value.x) / oldScale,
                y: (lastCenter.y - groupConfig.value.y) / oldScale
            }

            // 计算新的 group 位置
            const newPos = {
                x: newCenter.x - pointTo.x * newScale,
                y: newCenter.y - pointTo.y * newScale
            }

            groupConfig.value = {
                ...groupConfig.value,
                x: newPos.x,
                y: newPos.y,
                scaleX: newScale,
                scaleY: newScale
            }

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

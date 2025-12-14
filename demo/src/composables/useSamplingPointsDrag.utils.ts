import { computed, type Ref } from 'vue'
import type { Point } from '../utils/homography'
import { rotatePointAroundOrigin, getExpectedDirection, getCenter } from '../utils/geometry'
import type { ImageObjRef, MidPointData } from './useSamplingPoints.types'

interface DragDeps {
    points: Ref<Point[]>
    currentRatio: Ref<number>
    rotation: Ref<number>
    imageObj: ImageObjRef
}

/**
 * 采样点拖动逻辑
 */
export function useSamplingPointsDrag(deps: DragDeps) {
    const { points, currentRatio, rotation, imageObj } = deps

    /** 处理点拖动（自由模式） */
    const handleFreeModeDrag = (newPos: Point, index: number) => {
        points.value[index] = newPos
    }

    /** 处理点拖动（Free矩形模式，-2） */
    const handleFreeRectDrag = (newPos: Point, index: number) => {
        const oppositeIndex = (index + 2) % 4
        const oppositePoint = points.value[oppositeIndex]
        const rad = -rotation.value * Math.PI / 180
        const rotNewPos = rotatePointAroundOrigin(newPos, rad)
        const rotOpposite = rotatePointAroundOrigin(oppositePoint, rad)

        const pCurrent = rotNewPos
        const pOpposite = rotOpposite
        let pNext, pPrev

        if (index % 2 === 0) {
            pNext = { x: pOpposite.x, y: pCurrent.y }
            pPrev = { x: pCurrent.x, y: pOpposite.y }
        } else {
            pNext = { x: pCurrent.x, y: pOpposite.y }
            pPrev = { x: pOpposite.x, y: pCurrent.y }
        }

        const newPoints = [...points.value]
        newPoints[index] = rotatePointAroundOrigin(pCurrent, -rad)
        newPoints[(index + 1) % 4] = rotatePointAroundOrigin(pNext, -rad)
        newPoints[oppositeIndex] = rotatePointAroundOrigin(pOpposite, -rad)
        newPoints[(index + 3) % 4] = rotatePointAroundOrigin(pPrev, -rad)
        points.value = newPoints
    }

    /** 处理点拖动（比例约束模式） */
    const handleRatioDrag = (newPos: Point, index: number) => {
        const oppositeIndex = (index + 2) % 4
        const oppositePoint = points.value[oppositeIndex]
        const rad = -rotation.value * Math.PI / 180
        const rotNewPos = rotatePointAroundOrigin(newPos, rad)
        const rotOpposite = rotatePointAroundOrigin(oppositePoint, rad)

        let w = Math.abs(rotNewPos.x - rotOpposite.x)
        let h = Math.abs(rotNewPos.y - rotOpposite.y)

        let targetR = currentRatio.value
        if (targetR === -1 && imageObj.value) {
            targetR = imageObj.value.width / imageObj.value.height
        } else if (targetR === -1) {
            targetR = 1
        }

        const { signX: expectedSignX, signY: expectedSignY } = getExpectedDirection(index)
        if (w / h > targetR) {
            h = w / targetR
        } else {
            w = h * targetR
        }

        const alignedNewPos = {
            x: rotOpposite.x + w * expectedSignX,
            y: rotOpposite.y + h * expectedSignY
        }

        const newPoints = [...points.value]
        const worldNewPos = rotatePointAroundOrigin(alignedNewPos, -rad)
        newPoints[index] = worldNewPos
        newPoints[oppositeIndex] = oppositePoint

        let pNextAligned, pPrevAligned
        if (index % 2 === 0) {
            pNextAligned = { x: rotOpposite.x, y: alignedNewPos.y }
            pPrevAligned = { x: alignedNewPos.x, y: rotOpposite.y }
        } else {
            pNextAligned = { x: alignedNewPos.x, y: rotOpposite.y }
            pPrevAligned = { x: rotOpposite.x, y: alignedNewPos.y }
        }

        newPoints[(index + 1) % 4] = rotatePointAroundOrigin(pNextAligned, -rad)
        newPoints[(index + 3) % 4] = rotatePointAroundOrigin(pPrevAligned, -rad)
        points.value = newPoints
    }

    /** 处理点拖动 - 入口函数 */
    const handlePointDragMove = (e: any, index: number) => {
        const node = e.target
        const newPos = { x: node.x(), y: node.y() }

        if (currentRatio.value === 0) {
            handleFreeModeDrag(newPos, index)
        } else if (currentRatio.value === -2) {
            handleFreeRectDrag(newPos, index)
        } else {
            handleRatioDrag(newPos, index)
        }
    }

    /** 中点数据 */
    const midPoints = computed<MidPointData[]>(() => {
        if (points.value.length < 4 || currentRatio.value !== -2) return []
        return points.value.map((p, i) => {
            const nextP = points.value[(i + 1) % 4]
            const center = getCenter(p, nextP)
            return { x: center.x, y: center.y, index: i }
        })
    })

    /** 处理中点拖动 */
    const handleMidPointDragMove = (e: any, index: number) => {
        if (currentRatio.value !== -2) return

        const node = e.target
        const newPos = { x: node.x(), y: node.y() }
        const rad = -rotation.value * Math.PI / 180
        const rotNewPos = rotatePointAroundOrigin(newPos, rad)
        const alignedPoints = points.value.map(p => rotatePointAroundOrigin(p, rad))

        if (index === 0) {
            alignedPoints[0].y = rotNewPos.y
            alignedPoints[1].y = rotNewPos.y
        } else if (index === 2) {
            alignedPoints[2].y = rotNewPos.y
            alignedPoints[3].y = rotNewPos.y
        } else if (index === 1) {
            alignedPoints[1].x = rotNewPos.x
            alignedPoints[2].x = rotNewPos.x
        } else if (index === 3) {
            alignedPoints[3].x = rotNewPos.x
            alignedPoints[0].x = rotNewPos.x
        }

        points.value = alignedPoints.map(p => rotatePointAroundOrigin(p, -rad))
    }

    return {
        handlePointDragMove,
        midPoints,
        handleMidPointDragMove
    }
}

import type { Ref } from 'vue'
import type { Point } from '../utils/homography'
import { getPointsCenter, rotatePoint } from '../utils/geometry'

interface RotationDeps {
    points: Ref<Point[]>
    rotation: Ref<number>
    getLastRotation: () => number
    setLastRotation: (v: number) => void
}

/**
 * 采样点旋转逻辑
 */
export function useSamplingPointsRotation(deps: RotationDeps) {
    const { points, rotation, getLastRotation, setLastRotation } = deps

    /** 处理旋转输入 */
    const handleRotationInput = () => {
        const delta = rotation.value - getLastRotation()
        setLastRotation(rotation.value)

        const center = getPointsCenter(points.value)
        const rad = delta * Math.PI / 180
        points.value = points.value.map(p => rotatePoint(p, center, rad))
    }

    /** 重置旋转 */
    const resetRotation = () => {
        const delta = 0 - rotation.value
        rotation.value = 0
        setLastRotation(0)
        const center = getPointsCenter(points.value)
        const rad = delta * Math.PI / 180
        points.value = points.value.map(p => rotatePoint(p, center, rad))
    }

    /** 处理旋转器拖动 */
    const handleRotatorDragMove = (e: any) => {
        const node = e.target
        const center = getPointsCenter(points.value)
        const mouseX = node.x()
        const mouseY = node.y()

        const vMouseX = mouseX - center.x
        const vMouseY = mouseY - center.y
        const angleMouse = Math.atan2(vMouseY, vMouseX)

        let newRot = angleMouse * 180 / Math.PI + 90
        while (newRot > 180) newRot -= 360
        while (newRot < -180) newRot += 360

        const delta = newRot - rotation.value
        rotation.value = Math.round(newRot)
        setLastRotation(rotation.value)

        const rad = delta * Math.PI / 180
        points.value = points.value.map(p => rotatePoint(p, center, rad))
    }

    return {
        handleRotationInput,
        resetRotation,
        handleRotatorDragMove
    }
}

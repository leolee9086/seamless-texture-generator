import { ref } from 'vue'
import type { Point } from '../utils/homography'
import { snapPointsToRatio } from '../utils/geometry'
import type { ImageObjRef } from './useSamplingPoints.types'
import { RATIO_OPTIONS, INITIAL_MARGIN_RATIO } from './useSamplingPoints.constants'

/**
 * 采样点状态管理
 * @param imageObj 图片对象引用
 */
export function useSamplingPointsState(imageObj: ImageObjRef) {
    const points = ref<Point[]>([])
    const ratios = RATIO_OPTIONS
    const currentRatio = ref(0)
    const rotation = ref(0)
    let lastRotation = 0

    /** 重置采样点 */
    const resetPoints = () => {
        if (!imageObj.value) return
        const w = imageObj.value.width
        const h = imageObj.value.height
        const marginX = w * INITIAL_MARGIN_RATIO
        const marginY = h * INITIAL_MARGIN_RATIO

        points.value = [
            { x: marginX, y: marginY },
            { x: w - marginX, y: marginY },
            { x: w - marginX, y: h - marginY },
            { x: marginX, y: h - marginY }
        ]
        currentRatio.value = 0
        rotation.value = 0
        lastRotation = 0
    }

    /** 设置比例 */
    const setRatio = (r: number) => {
        currentRatio.value = r
        if (r === -1 && imageObj.value) {
            snapToRatio(imageObj.value.width / imageObj.value.height)
        } else if (r !== 0 && r !== -2) {
            snapToRatio(r)
        }
    }

    /** 按比例调整点 */
    const snapToRatio = (r: number) => {
        if (points.value.length < 4) return
        points.value = snapPointsToRatio(points.value, r, rotation.value)
    }

    /** 获取/设置 lastRotation */
    const getLastRotation = () => lastRotation
    const setLastRotation = (v: number) => { lastRotation = v }

    return {
        points,
        ratios,
        currentRatio,
        rotation,
        resetPoints,
        setRatio,
        getLastRotation,
        setLastRotation
    }
}

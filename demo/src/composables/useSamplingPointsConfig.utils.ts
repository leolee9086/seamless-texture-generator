import { computed, type Ref } from 'vue'
import type { Point } from '../utils/homography'
import { getCenter, getNormalVector } from '../utils/geometry'
import { ROTATION_HANDLE_OFFSET } from './useSamplingPoints.constants'

interface ConfigDeps {
    points: Ref<Point[]>
}

/**
 * 采样点Konva配置计算
 */
export function useSamplingPointsConfig(deps: ConfigDeps) {
    const { points } = deps

    /** 线条配置 */
    const lineConfig = computed(() => {
        if (points.value.length < 4) return {}
        const p = points.value
        return {
            points: [
                p[0].x, p[0].y,
                p[1].x, p[1].y,
                p[2].x, p[2].y,
                p[3].x, p[3].y,
                p[0].x, p[0].y
            ],
            stroke: '#00ff00',
            strokeWidth: 2,
            closed: true,
            listening: false
        }
    })

    /** 旋转线配置 */
    const rotationLineConfig = computed(() => {
        if (points.value.length < 4) return { visible: false }
        const p0 = points.value[0]
        const p1 = points.value[1]
        const center = getCenter(p0, p1)

        const dx = p1.x - p0.x
        const dy = p1.y - p0.y
        const { nx, ny } = getNormalVector(dx, dy)
        const offset = ROTATION_HANDLE_OFFSET

        const tipX = center.x + nx * offset
        const tipY = center.y + ny * offset

        return {
            points: [center.x, center.y, tipX, tipY],
            stroke: 'white',
            strokeWidth: 1,
            dash: [4, 4],
            listening: false
        }
    })

    /** 旋转手柄配置 */
    const rotationHandleConfig = computed(() => {
        if (points.value.length < 4) return { visible: false }
        const p0 = points.value[0]
        const p1 = points.value[1]
        const center = getCenter(p0, p1)
        const dx = p1.x - p0.x
        const dy = p1.y - p0.y
        const { nx, ny } = getNormalVector(dx, dy)
        const offset = ROTATION_HANDLE_OFFSET

        const tipX = center.x + nx * offset
        const tipY = center.y + ny * offset

        return {
            x: tipX,
            y: tipY,
            radius: 8,
            fill: 'white',
            stroke: '#000',
            strokeWidth: 1,
            draggable: true,
            hitStrokeWidth: 20
        }
    })

    return {
        lineConfig,
        rotationLineConfig,
        rotationHandleConfig
    }
}

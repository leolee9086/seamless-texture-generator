import { ref, computed } from 'vue'
import type { Point } from '../utils/homography'
import {
    getPointsCenter,
    rotatePoint,
    rotatePointAroundOrigin,
    snapPointsToRatio,
    getNormalVector,
    getCenter,
    getExpectedDirection
} from '../utils/geometry'

export function useSamplingPoints(imageObj: { value: HTMLImageElement | null }) {
    // 采样点状态
    const points = ref<Point[]>([]) // TopLeft, TopRight, BottomRight, BottomLeft
    
    // 编辑器状态
    const ratios = [
        { label: 'Free', value: 0 },
        { label: 'Original', value: -1 },
        { label: '1:1', value: 1 },
        { label: '4:3', value: 4 / 3 },
        { label: '16:9', value: 16 / 9 },
        { label: '9:16', value: 9 / 16 },
    ]
    const currentRatio = ref(0)
    const rotation = ref(0)
    let lastRotation = 0

    // 重置采样点
    const resetPoints = () => {
        if (!imageObj.value) return
        const w = imageObj.value.width
        const h = imageObj.value.height
        const marginX = w * 0.2
        const marginY = h * 0.2

        points.value = [
            { x: marginX, y: marginY },
            { x: w - marginX, y: marginY },
            { x: w - marginX, y: h - marginY },
            { x: marginX, y: h - marginY }
        ]

        // 重置控制状态
        currentRatio.value = 0
        rotation.value = 0
        lastRotation = 0
    }

    // 设置比例
    const setRatio = (r: number) => {
        currentRatio.value = r
        if (r === -1) {
            if (imageObj.value) {
                snapToRatio(imageObj.value.width / imageObj.value.height)
            }
        } else if (r !== 0) {
            snapToRatio(r)
        }
    }

    // 按比例调整点
    const snapToRatio = (r: number) => {
        if (points.value.length < 4) return
        points.value = snapPointsToRatio(points.value, r, rotation.value)
    }

    // 处理旋转输入
    const handleRotationInput = () => {
        const delta = rotation.value - lastRotation
        lastRotation = rotation.value

        const center = getPointsCenter(points.value)
        const rad = delta * Math.PI / 180
        points.value = points.value.map(p => rotatePoint(p, center, rad))
    }

    // 重置旋转
    const resetRotation = () => {
        const delta = 0 - rotation.value
        rotation.value = 0
        lastRotation = 0
        const center = getPointsCenter(points.value)
        const rad = delta * Math.PI / 180
        points.value = points.value.map(p => rotatePoint(p, center, rad))
    }

    // 处理点拖动
    const handlePointDragMove = (e: any, index: number, groupScale: number) => {
        const node = e.target
        const newPos = { x: node.x(), y: node.y() }

        if (currentRatio.value === 0) {
            // 自由模式（透视）
            points.value[index] = newPos
            return
        }

        // 约束模式（矩形 + 比例）
        const oppositeIndex = (index + 2) % 4
        const oppositePoint = points.value[oppositeIndex]

        // 旋转到轴对齐空间（围绕原点简化）
        const rad = -rotation.value * Math.PI / 180
        const rotNewPos = rotatePointAroundOrigin(newPos, rad)
        const rotOpposite = rotatePointAroundOrigin(oppositePoint, rad)

        // 计算新尺寸
        let w = Math.abs(rotNewPos.x - rotOpposite.x)
        let h = Math.abs(rotNewPos.y - rotOpposite.y)

        // 强制比例
        let targetR = currentRatio.value
        if (targetR === -1) {
            if (imageObj.value) {
                targetR = imageObj.value.width / imageObj.value.height
            } else {
                targetR = 1 // 回退值
            }
        }

        // 根据索引确定预期方向以防止翻转
        const { signX: expectedSignX, signY: expectedSignY } = getExpectedDirection(index)

        if (w / h > targetR) {
            h = w / targetR
        } else {
            w = h * targetR
        }

        // 新对齐角位置
        const alignedNewPos = {
            x: rotOpposite.x + w * expectedSignX,
            y: rotOpposite.y + h * expectedSignY
        }

        // 在对齐空间重建矩形
        const newPoints = [...points.value]

        // 旋转回世界空间
        const worldNewPos = rotatePointAroundOrigin(alignedNewPos, -rad)

        newPoints[index] = worldNewPos
        newPoints[oppositeIndex] = oppositePoint // 对角点保持固定

        // 计算其他两个点
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

    // 处理旋转器拖动
    const handleRotatorDragMove = (e: any) => {
        const node = e.target
        const center = getPointsCenter(points.value)
        const mouseX = node.x()
        const mouseY = node.y()

        // 从中心到鼠标的向量
        const vMouseX = mouseX - center.x
        const vMouseY = mouseY - center.y
        const angleMouse = Math.atan2(vMouseY, vMouseX)

        // 计算新旋转
        let newRot = angleMouse * 180 / Math.PI + 90

        // 标准化到 -180 到 180
        while (newRot > 180) newRot -= 360
        while (newRot < -180) newRot += 360

        const delta = newRot - rotation.value
        rotation.value = Math.round(newRot) // 四舍五入以获得更清晰的UI
        lastRotation = rotation.value

        const rad = delta * Math.PI / 180
        points.value = points.value.map(p => rotatePoint(p, center, rad))
    }

    // 计算配置
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
            strokeWidth: 2, // 将在组件中根据缩放调整
            closed: true,
            listening: false // 不干扰点击
        }
    })

    const rotationLineConfig = computed(() => {
        if (points.value.length < 4) return { visible: false }
        const p0 = points.value[0]
        const p1 = points.value[1]
        const center = getCenter(p0, p1)

        const dx = p1.x - p0.x
        const dy = p1.y - p0.y
        const { nx, ny } = getNormalVector(dx, dy)
        const offset = 40 // 将在组件中根据缩放调整

        const tipX = center.x + nx * offset
        const tipY = center.y + ny * offset

        return {
            points: [center.x, center.y, tipX, tipY],
            stroke: 'white',
            strokeWidth: 1, // 将在组件中根据缩放调整
            dash: [4, 4],
            listening: false
        }
    })

    const rotationHandleConfig = computed(() => {
        if (points.value.length < 4) return { visible: false }
        const p0 = points.value[0]
        const p1 = points.value[1]
        const center = getCenter(p0, p1)
        const dx = p1.x - p0.x
        const dy = p1.y - p0.y
        const { nx, ny } = getNormalVector(dx, dy)
        const offset = 40 // 将在组件中根据缩放调整

        const tipX = center.x + nx * offset
        const tipY = center.y + ny * offset

        return {
            x: tipX,
            y: tipY,
            radius: 8, // 将在组件中根据缩放调整
            fill: 'white',
            stroke: '#000',
            strokeWidth: 1, // 将在组件中根据缩放调整
            draggable: true,
            hitStrokeWidth: 20 // 将在组件中根据缩放调整
        }
    })

    return {
        // 状态
        points,
        ratios,
        currentRatio,
        rotation,
        
        // 方法
        resetPoints,
        setRatio,
        handleRotationInput,
        resetRotation,
        handlePointDragMove,
        handleRotatorDragMove,
        
        // 计算配置
        lineConfig,
        rotationLineConfig,
        rotationHandleConfig
    }
}
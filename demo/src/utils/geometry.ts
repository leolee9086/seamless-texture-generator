import { Point } from './homography'

/**
 * 计算点集的中心点
 * @param pts 点集
 * @returns 中心点坐标
 */
export function getPointsCenter(pts: Point[]): Point {
    let x = 0, y = 0
    pts.forEach(p => { x += p.x; y += p.y })
    return { x: x / pts.length, y: y / pts.length }
}

/**
 * 围绕指定中心点旋转一个点
 * @param p 要旋转的点
 * @param center 旋转中心点
 * @param rad 旋转弧度
 * @returns 旋转后的点
 */
export function rotatePoint(p: Point, center: Point, rad: number): Point {
    const dx = p.x - center.x
    const dy = p.y - center.y
    return {
        x: center.x + dx * Math.cos(rad) - dy * Math.sin(rad),
        y: center.y + dx * Math.sin(rad) + dy * Math.cos(rad)
    }
}

/**
 * 围绕原点旋转一个点
 * @param p 要旋转的点
 * @param rad 旋转弧度
 * @returns 旋转后的点
 */
export function rotatePointAroundOrigin(p: Point, rad: number): Point {
    return {
        x: p.x * Math.cos(rad) - p.y * Math.sin(rad),
        y: p.x * Math.sin(rad) + p.y * Math.cos(rad)
    }
}

/**
 * 计算两点之间的距离
 * @param p1 第一个点
 * @param p2 第二个点
 * @returns 两点之间的距离
 */
export function getDistance(p1: Point, p2: Point): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
}

/**
 * 计算两点之间的中心点
 * @param p1 第一个点
 * @param p2 第二个点
 * @returns 两点之间的中心点
 */
export function getCenter(p1: Point, p2: Point): Point {
    return {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2
    }
}

/**
 * 计算点集的边界框
 * @param points 点集
 * @returns 边界框 {minX, maxX, minY, maxY}
 */
export function getBoundingBox(points: Point[]): { minX: number, maxX: number, minY: number, maxY: number } {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    
    points.forEach(p => {
        minX = Math.min(minX, p.x)
        maxX = Math.max(maxX, p.x)
        minY = Math.min(minY, p.y)
        maxY = Math.max(maxY, p.y)
    })
    
    return { minX, maxX, minY, maxY }
}

/**
 * 根据宽高比调整点集
 * @param points 原始点集
 * @param targetRatio 目标宽高比
 * @param rotation 当前旋转角度（度）
 * @returns 调整后的点集
 */
export function snapPointsToRatio(points: Point[], targetRatio: number, rotation: number): Point[] {
    if (points.length < 4) return points

    const center = getPointsCenter(points)
    const rad = -rotation * Math.PI / 180

    // 旋转回轴对齐空间以测量尺寸
    const unrotatedPoints = points.map(p => rotatePoint(p, center, rad))
    const { minX, maxX, minY, maxY } = getBoundingBox(unrotatedPoints)

    const w = maxX - minX
    const h = maxY - minY
    const currentR = w / h

    let newW = w
    let newH = h

    if (targetRatio > currentR) {
        // 目标更宽，约束高度以匹配宽度
        newH = w / targetRatio
    } else {
        // 目标更高，约束宽度以匹配高度
        newW = h * targetRatio
    }

    const cx = (minX + maxX) / 2
    const cy = (minY + maxY) / 2

    const newPoints = [
        { x: cx - newW / 2, y: cy - newH / 2 }, // TL
        { x: cx + newW / 2, y: cy - newH / 2 }, // TR
        { x: cx + newW / 2, y: cy + newH / 2 }, // BR
        { x: cx - newW / 2, y: cy + newH / 2 }, // BL
    ]

    // 旋转回当前旋转状态
    return newPoints.map(p => rotatePoint(p, center, -rad))
}

/**
 * 计算向量的法向量
 * @param dx 向量的x分量
 * @param dy 向量的y分量
 * @returns 法向量 {nx, ny}
 */
export function getNormalVector(dx: number, dy: number): { nx: number, ny: number } {
    const len = Math.sqrt(dx * dx + dy * dy) || 1
    return {
        nx: dy / len,
        ny: -dx / len
    }
}

/**
 * 根据索引确定点的预期方向符号
 * @param index 点的索引（0-3）
 * @returns 方向符号 {signX, signY}
 */
export function getExpectedDirection(index: number): { signX: number, signY: number } {
    // 0: TL (-1, -1), 1: TR (1, -1), 2: BR (1, 1), 3: BL (-1, 1)
    if (index === 0) return { signX: -1, signY: -1 }
    else if (index === 1) return { signX: 1, signY: -1 }
    else if (index === 2) return { signX: 1, signY: 1 }
    else return { signX: -1, signY: 1 } // index === 3
}
import type { Point } from '../utils/homography'
import type { Ref, ComputedRef } from 'vue'

/** 比例选项 */
export interface RatioOption {
    label: string
    value: number
}

/** 采样点状态 */
export interface SamplingPointsState {
    points: Ref<Point[]>
    currentRatio: Ref<number>
    rotation: Ref<number>
}

/** Konva 线条配置 */
export interface LineConfig {
    points?: number[]
    stroke?: string
    strokeWidth?: number
    closed?: boolean
    listening?: boolean
    visible?: boolean
}

/** Konva 旋转手柄配置 */
export interface RotationHandleConfig {
    x?: number
    y?: number
    radius?: number
    fill?: string
    stroke?: string
    strokeWidth?: number
    draggable?: boolean
    hitStrokeWidth?: number
    visible?: boolean
}

/** 中点数据 */
export interface MidPointData {
    x: number
    y: number
    index: number
}

/** 图片对象引用类型 */
export interface ImageObjRef {
    value: HTMLImageElement | null
}

import type { RatioOption } from './useSamplingPoints.types'

/** 预设比例选项 */
export const RATIO_OPTIONS: RatioOption[] = [
    { label: 'Perspective', value: 0 },
    { label: 'Free', value: -2 },
    { label: 'Original', value: -1 },
    { label: '1:1', value: 1 },
    { label: '4:3', value: 4 / 3 },
    { label: '16:9', value: 16 / 9 },
    { label: '9:16', value: 9 / 16 },
]

/** 初始边距比例 */
export const INITIAL_MARGIN_RATIO = 0.2

/** 旋转手柄偏移量 */
export const ROTATION_HANDLE_OFFSET = 40

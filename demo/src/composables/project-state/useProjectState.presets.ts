/**
 * 项目默认参数预设
 */

import type { ProjectParams } from './imports'
import { 默认去雾参数, 默认清晰度参数, 默认亮度参数 } from './imports'

/**
 * 获取默认项目参数
 * @returns 默认的项目参数对象
 */
export function 获取默认项目参数(): ProjectParams {
    return {
        globalHSL: { hue: 0, saturation: 0, lightness: 0 },
        hslLayers: [],
        exposureStrength: 1.0,
        exposureManual: { exposure: 1.0, contrast: 1.0, gamma: 1.0 },
        dehazeParams: { ...默认去雾参数 },
        clarityParams: { ...默认清晰度参数 },
        luminanceParams: { ...默认亮度参数 },
        borderSize: 0,
        maxResolution: 4096
    }
}

/** @简洁函数 获取器函数，将默认参数导出 */
export const 默认项目参数 = 获取默认项目参数

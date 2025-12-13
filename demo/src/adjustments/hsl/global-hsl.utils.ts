import type { GlobalHSLAdjustmentParams } from './hsl-shaders.types';

/**
 * 创建全局HSL参数缓冲区数据
 */
export function createGlobalHSLParams(params: GlobalHSLAdjustmentParams): Float32Array {
    // 创建4个元素的数组以满足16字节对齐要求
    const data = new Float32Array(4)

    // 填充实际的3个参数值
    data[0] = params.hueOffset / 360     // hueOffset (Offset 0)
    data[1] = params.saturationOffset / 100 // saturationOffset (Offset 4)
    data[2] = params.lightnessOffset / 100  // lightnessOffset (Offset 8)
    data[3] = 0.0 // Padding (Offset 12)

    return data
}
/**
 * 将一组数字按指定倍数缩放并四舍五入取整
 * @param scale 缩放倍数
 * @param args 需要缩放的数字数组
 * @returns 缩放并取整后的数字数组
 */
export const 缩放到指定倍数并取整 = (scale: number, ...args: number[]): number[] => {
    // 边界检查：如果缩放倍数为NaN，返回空数组
    if (isNaN(scale)) {
        return []
    }
    
    return args.map(arg => Math.round(arg * scale))
}

/**
 * 将一组数字缩放并取整到指定目标尺寸
 * @param target 目标尺寸
 * @param args 原始尺寸数组
 * @returns 缩放并取整后的尺寸数组
 */
export const 缩放并取整到指定整数 = (target: number, ...args: number[]): number[] => {
    // 边界检查：如果没有提供原始尺寸，返回空数组
    if (args.length === 0) {
        return []
    }
    
    const scale = 获取到指定值的缩放倍数(target, ...args)
    return 缩放到指定倍数并取整(scale, ...args)
}

/**
 * 计算将一组数字缩放到指定目标值所需的缩放倍数
 * @param target 目标值
 * @param args 原始数字数组
 * @returns 缩放倍数（不超过1）
 */
export const 获取到指定值的缩放倍数 = (target: number, ...args: number[]): number => {
    // 边界检查：如果没有提供参数，返回1（不缩放）
    if (args.length === 0) {
        return 1
    }
    
    // 边界检查：如果目标值为非正数，返回0（完全缩小）
    if (target <= 0) {
        return 0
    }
    
    const maxValue = Math.max(...args)
    
    // 边界检查：如果最大值为非正数，返回1（不缩放）
    if (maxValue <= 0) {
        return 1
    }
    
    return Math.min(1, target / maxValue)
}

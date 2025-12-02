/**
 * 
 * @param scale 
 * @param args 
 * @returns 
 */
export const 缩放到指定倍数并取整 = (scale: number, ...args: number[]) => {
    return args.map(arg => Math.round(arg * scale))
}
/**
 * 
 * @param target 目标尺寸
 * @param args 原始尺寸
 * @returns 缩放后的尺寸
 */
export const 缩放并取整到指定整数 = (target: number, ...args: number[]) => {
    const scale = 获取到指定值的缩放倍数(target, ...args)
    return 缩放到指定倍数并取整(scale, ...args)
}
export const 获取到指定值的缩放倍数 = (target: number, ...args: number[]) => {
    return Math.min(1, target / Math.max(...args))
}

import type { DehazeParams } from './imports'

/**
 * 去雾参数键的类型守卫
 * @param key 参数键
 * @returns 是否为有效的 DehazeParams 键
 */
export function isValidDehazeParamKey(key: string): key is keyof DehazeParams {
    const validKeys: (keyof DehazeParams)[] = [
        'omega',
        't0',
        'windowSize',
        'topRatio',
        'adaptiveMode',
        'spatialAdaptiveMode',
        'adaptiveStrength',
        'hazeWeight',
        'atmosphericWeight',
        'enableEnhancement',
        'saturationEnhancement',
        'contrastEnhancement',
        'brightnessEnhancement'
    ]
    return validKeys.includes(key as keyof DehazeParams)
}

/**
 * 检查参数键是否为数字类型（用于滑块）
 * @param key 参数键
 * @returns 是否为数字键
 */
export function isNumericDehazeParamKey(key: keyof DehazeParams): boolean {
    const numericKeys: (keyof DehazeParams)[] = [
        'omega',
        't0',
        'windowSize',
        'topRatio',
        'adaptiveStrength',
        'hazeWeight',
        'atmosphericWeight',
        'saturationEnhancement',
        'contrastEnhancement',
        'brightnessEnhancement'
    ]
    return numericKeys.includes(key)
}

/**
 * 类型守卫：检查值是否为数字
 * @param value 任意值
 * @returns 是否为数字
 */
export function isNumber(value: unknown): value is number {
    return typeof value === 'number'
}
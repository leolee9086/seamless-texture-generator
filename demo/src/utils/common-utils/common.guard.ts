/**
 * 通用的类型守卫函数
 */

/**
 * 类型守卫：检查值是否为数字（非NaN）
 * @param value 任意值
 * @returns 是否为数字（非NaN）
 */
export function isNumber(value: unknown): value is number {
    return typeof value === 'number' && !isNaN(value);
}

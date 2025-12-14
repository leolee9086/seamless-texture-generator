/**
 * 通用的类型守卫函数
 */

/**
 * 类型守卫：检查值是否为数字（非NaN）
 * @简洁函数 类型守卫谓词函数，职责单一，简洁性是有意设计
 * @param value 任意值
 * @returns 是否为数字（非NaN）
 */
export function isNumber(value: unknown): value is number {
    return typeof value === 'number' && !isNaN(value);
}

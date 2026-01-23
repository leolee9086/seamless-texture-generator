/**
 * useTextureState - 类型守卫
 */

/**
 * 检查值是否为字符串或 null
 * @简洁函数 类型守卫谓词函数
 */
export function isStringOrNull(value: unknown): value is string | null {
    return typeof value === 'string' || value === null
}

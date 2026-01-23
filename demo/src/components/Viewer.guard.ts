/**
 * Viewer 组件类型守卫
 */

/**
 * 检查值是否为字符串类型
 *
 * @简洁函数 类型守卫谓词函数
 * @param value - 待检查的值
 * @returns 是否为字符串
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

/**
 * 检查值是否为字符串或null
 *
 * @简洁函数 类型守卫谓词函数
 * @param value - 待检查的值
 * @returns 是否为字符串或null
 */
export function isStringOrNull(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}

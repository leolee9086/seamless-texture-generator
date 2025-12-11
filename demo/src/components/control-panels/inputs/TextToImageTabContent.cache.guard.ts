/**
 * 缓存类型守卫
 */

/**
 * 检查值是否为非空字符串
 */
export function isNonNullString(value: string | null): value is string {
  return value !== null
}
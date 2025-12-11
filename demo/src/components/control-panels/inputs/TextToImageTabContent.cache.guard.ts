/**
 * 缓存类型守卫
 */

/**
 * 检查值是否为非空字符串
 */
export function isNonNullString(value: string | null): value is string {
  return value !== null
}

/**
 * 检查是否为字符串数组
 */
export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string')
}
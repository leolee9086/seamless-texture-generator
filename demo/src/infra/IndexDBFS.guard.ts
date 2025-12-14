
/**
 * 检查值是否为数组
 * 注意：由于泛型 T 在运行时会被擦除，此函数仅检查是否为数组，
 * 无法验证数组元素的具体类型。调用者需要确保上下文类型的正确性。
 * @param value 需要检查的值
 * @简洁函数 这是一个基础的类型守卫函数
 */
export function isArray<T>(value: unknown): value is T[] {
    return Array.isArray(value);
}

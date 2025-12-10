/**
 * 类型守卫函数，用于检查EventTarget是否为HTMLInputElement
 */
export const isHTMLInputElement = (element: EventTarget | null): element is HTMLInputElement => {
    return element !== null && element instanceof HTMLInputElement
}

/**
 * 类型守卫函数，用于检查FileReader的result是否为字符串
 */
export const isFileReaderResultString = (result: unknown): result is string => {
    return typeof result === 'string'
}
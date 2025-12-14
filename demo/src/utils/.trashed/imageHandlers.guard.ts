/**
 * 图像处理相关的类型守卫函数
 */

/**
 * 检查FileReader的结果是否为字符串类型
 * @param result FileReader的结果
 * @returns 如果是字符串类型返回true，否则返回false
 */
export function isFileReaderResultString(result: unknown): result is string {
  return typeof result === 'string'
}

/**
 * 检查事件目标是否为FileReader
 * @param target 事件目标
 * @returns 如果是FileReader返回true，否则返回false
 */
export function isFileReader(target: unknown): target is FileReader {
  return target instanceof FileReader
}

/**
 * 检查事件目标是否为HTMLInputElement
 * @param target 事件目标
 * @returns 如果是HTMLInputElement返回true，否则返回false
 */
export function isHTMLInputElement(target: unknown): target is HTMLInputElement {
  return target instanceof HTMLInputElement
}
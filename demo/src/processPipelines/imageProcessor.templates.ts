/**
 * 图像处理器模板定义
 */

export const TEMPLATES = {
  /**
   * 处理错误消息模板
   * @param error 错误详情
   */
  processingError: (error: string): string => `处理图像时出错: ${error}`
} as const
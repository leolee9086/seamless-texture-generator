export const dehazeFailed = (error: unknown): string => {
  return `去雾处理失败: ${error instanceof Error ? error.message : String(error)}`
}
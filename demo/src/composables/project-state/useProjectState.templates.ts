/**
 * 项目状态管理错误消息模板
 */

/** 无法创建 Canvas 上下文错误 */
export const 创建Canvas上下文失败 = (): string => '无法创建 Canvas 上下文'

/** 生成缩略图失败错误 */
export const 缩略图生成失败 = (): string => '生成缩略图失败'

/** 加载图片失败错误 */
export const 图片加载失败 = (): string => '加载图片失败'

/** 项目创建失败消息 */
export const 项目创建失败消息 = (fileName: string): string => `创建项目失败: ${fileName}`

// ============================================================================
// 路径模板
// ============================================================================

/** 原图资产路径 */
export const 原图资产路径 = (id: string): string => `assets/${id}_original`

/** 缩略图资产路径 */
export const 缩略图资产路径 = (id: string): string => `assets/${id}_thumb`

/** 原图资产 key */
export const 原图资产Key = (id: string): string => `${id}_original`

/** 缩略图资产 key */
export const 缩略图资产Key = (id: string): string => `${id}_thumb`

/** 资产路径前缀 */
export const 资产路径前缀 = 'assets/'

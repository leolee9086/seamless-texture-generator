/**
 * 缓存相关类型定义
 */

/**
 * 缓存图片函数类型
 */
export interface CacheImageFunction {
  (base64: string, url: string): Promise<void>
}

/**
 * 获取所有缓存图片函数类型
 */
export interface GetCachedImagesFunction {
  (): Promise<string[]>
}

/**
 * 根据 URL 获取缓存图片函数类型
 */
export interface GetCachedImageByUrlFunction {
  (url: string): Promise<string | null>
}

/**
 * 清空所有缓存函数类型
 */
export interface ClearAllCacheFunction {
  (): Promise<void>
}
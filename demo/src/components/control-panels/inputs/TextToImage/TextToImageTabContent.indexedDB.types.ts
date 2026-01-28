
/**
 * IndexedDB 图片缓存类型定义
 */

/**
 * 旧版缓存项 (V1) - 使用 Base64 字符串存储
 * @deprecated 仅用于向后兼容和数据迁移
 */
export interface ImageCacheItemV1 {
    url: string;
    base64: string;
    timestamp: number;
    version?: 1;
}

/**
 * 新版缓存项 (V2) - 使用 Blob 存储
 * 优势：
 * - 存储空间节省 25% (避免 Base64 的 33% 体积膨胀)
 * - 读写速度更快 (无需编解码)
 * - 可直接创建 Blob URL 用于显示
 */
export interface ImageCacheItemV2 {
    url: string;
    blob: Blob;
    timestamp: number;
    version: 2;
    mimeType: string;
}

/**
 * 统一缓存项类型 - 支持 V1 和 V2
 */
export type ImageCacheItem = ImageCacheItemV1 | ImageCacheItemV2;

/**
 * URL 列表元数据
 */
export interface UrlListMeta {
    id: string;
    urls: string[];
}

/**
 * 缓存版本常量
 */
export const CACHE_VERSION = {
    V1: 1,
    V2: 2,
    CURRENT: 2,
} as const;

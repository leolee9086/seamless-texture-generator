/**
 * 图像下载参数接口
 */
export interface ImageDownloadParams {
    dataURL: string;
    mimeType: string;
    fileName: string;
    format: string;
}

/**
 * Blob 获取器类型
 * 用于从 Blob URL 获取 Blob 对象的函数签名
 */
export type BlobFetcher = (blobUrl: string) => Promise<Blob>
import type { ImageDownloadParams } from './imports'
import {
    默认下载文件名,
    MIME类型_JPEG,
    协议前缀_BLOB,
    错误消息_无效DATAURL,
    MIME类型_PNG,
    默认图像文件名,
    错误消息_保存图像失败,
    原始图像文件名,
    无缝纹理文件名,
} from './download.constants'

/**
 * 下载 Canvas 内容为 JPG 图像
 * @param canvas - 要下载的 Canvas 元素
 * @param fileName - 文件名
 */
export const downloadCanvasJPG = (canvas: HTMLCanvasElement | null, fileName: string = 默认下载文件名): void => {
    if (!canvas) return;
    // 使用高质量 (1.0) 从 canvas 创建 JPG 链接
    const imageUrl = canvas.toDataURL(MIME类型_JPEG, 1.0);
    // 创建临时链接元素
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${fileName}.jpg`; // 设置下载文件名
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * 将 DataURL 转换为 Blob 对象
 * @param dataURL - 图像的 DataURL 或 Blob URL
 * @returns Promise<Blob> 对象
 */
export const dataURLToBlob = async (dataURL: string): Promise<Blob> => {
    // 兼容处理：如果是已经生成的 blob URL，则通过 fetch 重新获取 blob 对象
    if (dataURL.startsWith(协议前缀_BLOB)) {
        const response = await fetch(dataURL)
        return await response.blob()
    }

    const arr = dataURL.split(',')
    if (arr.length < 2) {
        throw new Error(错误消息_无效DATAURL)
    }

    const mimeMatch = arr[0].match(/:(.*?);/)
    const mime = mimeMatch?.[1] || MIME类型_PNG

    // 健壮处理 atob：移除可能的换行符或空格
    const bstr = atob(arr[1].replace(/\s/g, ''))
    let 字节长度 = bstr.length
    const u8arr = new Uint8Array(字节长度)
    while (字节长度--) {
        u8arr[字节长度] = bstr.charCodeAt(字节长度)
    }
    return new Blob([u8arr], { type: mime })
}

/**
 * 保存图像到本地
 * @param imageData - 图像数据，可以是 DataURL、Blob URL 或 Canvas
 * @param fileName - 文件名（不包含扩展名）
 * @param format - 图像格式，默认为 'png'
 */
export const saveImage = async (
    imageData: string | HTMLCanvasElement | null,
    fileName: string = 默认图像文件名,
    format: 'png' | 'jpg' | 'jpeg' = 'png'
): Promise<void> => {
    if (!imageData) return

    try {
        let dataURL: string
        let mimeType: string

        // 卫语句：处理字符串类型的图像数据
        if (typeof imageData === 'string') {
            dataURL = imageData
            // 从 DataURL 中提取 MIME 类型，如果是 blob URL 则标记为未知由浏览器处理
            if (dataURL.startsWith(协议前缀_BLOB)) {
                mimeType = `image/${format}`
            } else {
                const match = imageData.match(/data:([^;]+);/)
                mimeType = match?.[1] || `image/${format}`
            }
            return await processImageDownload({ dataURL, mimeType, fileName, format })
        }

        // 卫语句：处理 Canvas 类型的图像数据
        mimeType = format === 'jpg' || format === 'jpeg' ? MIME类型_JPEG : MIME类型_PNG
        const quality = format === 'jpg' || format === 'jpeg' ? 1.0 : undefined
        dataURL = imageData.toDataURL(mimeType, quality)
        await processImageDownload({ dataURL, mimeType, fileName, format })
    } catch (error) {
        console.error(错误消息_保存图像失败, error)
    }
}

/**
 * 处理图像下载的通用逻辑
 */
const processImageDownload = async (params: ImageDownloadParams): Promise<void> => {
    const { dataURL, fileName, format } = params

    let url: string
    let isCreated = false

    // 如果本身就是 blob URL，没必要再转一次 blob 再转回 URL
    if (dataURL.startsWith(协议前缀_BLOB)) {
        url = dataURL
    } else {
        const blob = await dataURLToBlob(dataURL)
        url = URL.createObjectURL(blob)
        isCreated = true
    }

    const link = document.createElement('a')
    link.href = url
    link.download = `${fileName}-${Date.now()}.${format}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    if (isCreated) {
        URL.revokeObjectURL(url)
    }
}

/**
 * 保存原始图像
 * @param imageData - 图像的 DataURL
 */
export const saveOriginalImage = async (imageData: string): Promise<void> => {
    await saveImage(imageData, 原始图像文件名, 'png')
}

/**
 * 保存处理后的图像
 * @param imageData - 图像的 DataURL
 */
export const saveProcessedImage = (imageData: string): void => {
    saveImage(imageData, 无缝纹理文件名, 'png')
}

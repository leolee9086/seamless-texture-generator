import type { PipelineData } from './imports'
import { gpuBufferToImageData, getWebGPUDevice } from './imports'

/**
 * 已撤销的 Blob URL 缓存，用于在下次处理前释放内存
 */
let 上一次BlobURL: string | null = null

/**
 * 将 GPUBuffer 转换为 Blob URL
 * 
 * 使用 toBlob + createObjectURL 替代 toDataURL，避免 Base64 编码开销
 * 
 * @param data 管线数据
 * @returns Blob URL 字符串 (blob:...)
 */
export async function convertToDataURL(data: PipelineData): Promise<string> {
    const device = await getWebGPUDevice()

    // 将 GPUBuffer 转换为 ImageData
    const imageData = await gpuBufferToImageData(data.buffer, data.width, data.height, device)

    // 将处理后的图像数据转换为 Canvas
    const canvas = document.createElement('canvas')
    canvas.width = imageData.width
    canvas.height = imageData.height
    const ctx = canvas.getContext('2d')!
    ctx.putImageData(imageData, 0, 0)

    // 释放上一次的 Blob URL，避免内存泄漏
    if (上一次BlobURL) {
        URL.revokeObjectURL(上一次BlobURL)
    }

    // 使用 toBlob 异步转换，避免 Base64 编码开销
    const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
            (生成的Blob) => 生成的Blob ? resolve(生成的Blob) : reject(new Error('toBlob 失败')),
            'image/png'
        )
    })

    const blobURL = URL.createObjectURL(blob)
    上一次BlobURL = blobURL

    return blobURL
}

/**
 * 手动释放当前缓存的 Blob URL
 * 在切换图片或清空项目时调用
 */
export function 释放输出缓存(): void {
    if (上一次BlobURL) {
        URL.revokeObjectURL(上一次BlobURL)
        上一次BlobURL = null
    }
}

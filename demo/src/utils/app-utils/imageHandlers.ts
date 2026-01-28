import { isHTMLInputElement } from './imageHandlers.guard'

/**
 * 处理图像上传
 * 使用 URL.createObjectURL() 创建 Blob URL，比 FileReader.readAsDataURL() 更高效
 *
 * 注意：Blob URL 在以下情况会自动释放：
 * - 页面卸载时
 * - 文档被关闭时
 *
 * 如果需要手动释放内存（例如频繁上传场景），调用方可以在不再需要时调用：
 * URL.revokeObjectURL(blobUrl)
 *
 * @param event 文件上传事件
 * @param onImageLoaded 图像加载完成回调，返回 Blob URL 字符串
 */
export function handleImageUpload(event: Event, onImageLoaded: (imageData: string) => void): void {
    if (!isHTMLInputElement(event.target)) {
        return
    }

    const file = event.target.files?.[0]

    if (file) {
        const blobUrl = URL.createObjectURL(file)
        onImageLoaded(blobUrl)
    }
}

/**
 * 重置缩放级别
 * @param onZoomReset 缩放重置回调
 * @param viewerRef 查看器引用
 */
export function resetZoom(onZoomReset: () => void, viewerRef: { value?: { resetZoom: () => void } }): void {
    onZoomReset()
    if (viewerRef?.value) {
        viewerRef.value.resetZoom()
    }
}

/**
 * 保存图像（原始或处理后）
 * @param image 图像URL
 * @param saveFunction 保存函数
 */
export function saveImage(image: string | null, saveFunction: (imageData: string) => void): void {
    if (!image) return
    saveFunction(image)
}

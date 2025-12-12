import { isHTMLInputElement, isFileReader, isFileReaderResultString } from './imageHandlers.guard'

/**
 * 处理图像上传
 * @param event 文件上传事件
 * @param onImageLoaded 图像加载完成回调
 */
export function handleImageUpload(event: Event, onImageLoaded: (imageData: string) => void): void {
  if (!isHTMLInputElement(event.target)) {
    return
  }
  
  const file = event.target.files?.[0]

  if (file) {
    const reader = new FileReader()
    reader.onload = (e: ProgressEvent<FileReader>): void => {
      if (!isFileReader(e.target)) {
        return
      }
      
      const result = e.target.result
      if (isFileReaderResultString(result)) {
        onImageLoaded(result)
      }
    }
    reader.onerror = (): void => {
      console.error('文件读取失败')
    }
    reader.readAsDataURL(file)
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
export function saveImage(image: string | null, saveFunction: (img: string) => void): void {
  if (!image) return
  saveFunction(image)
}
/**
 * 处理图像上传
 * @param event 文件上传事件
 * @param onImageLoaded 图像加载完成回调
 */
export function handleImageUpload(event: Event, onImageLoaded: (imageData: string) => void): void {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const imageData = e.target?.result as string
      onImageLoaded(imageData)
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
export function 保存图像(image: string | null, saveFunction: (img: string) => void): void {
  if (!image) return
  saveFunction(image)
}
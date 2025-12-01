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
 * 加载示例图像
 * @param onImageLoaded 图像加载完成回调
 */
export function loadSampleImage(onImageLoaded: (imageData: string) => void): void {
  const sampleImageUrl = 'https://picsum.photos/seed/texture/512/512.jpg'
  onImageLoaded(sampleImageUrl)
}

/**
 * 处理采样确认
 * @param imageData 采样后的图像数据
 * @param onImageUpdated 图像更新回调
 */
export function handleSamplingConfirm(imageData: string, onImageUpdated: (imageData: string) => void): void {
  onImageUpdated(imageData)
}

/**
 * 切换放大镜状态
 * @param currentEnabled 当前放大镜状态
 * @param onToggle 状态切换回调
 */
export function toggleMagnifier(currentEnabled: boolean, onToggle: (enabled: boolean) => void): void {
  onToggle(!currentEnabled)
}

/**
 * 重置缩放级别
 * @param onZoomReset 缩放重置回调
 * @param viewerRef 查看器引用
 */
export function resetZoom(onZoomReset: () => void, viewerRef: any): void {
  onZoomReset()
  if (viewerRef?.value) {
    viewerRef.value.resetZoom()
  }
}

/**
 * 保存原始图像
 * @param originalImage 原始图像URL
 * @param saveFunction 保存函数
 */
export function saveOriginal(originalImage: string | null, saveFunction: (image: string) => void): void {
  if (!originalImage) return
  saveFunction(originalImage)
}

/**
 * 保存处理后的图像
 * @param processedImage 处理后的图像URL
 * @param saveFunction 保存函数
 */
export function saveResult(processedImage: string | null, saveFunction: (image: string) => void): void {
  if (!processedImage) return
  saveFunction(processedImage)
}
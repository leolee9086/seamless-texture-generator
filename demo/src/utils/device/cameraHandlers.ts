/**
 * 处理摄像头拍照结果
 * @param imageData 拍照获取的图像数据
 * @param onImageUpdated 图像更新回调
 * @param onError 错误处理回调
 */
export function handlePhotoCaptured(
  imageData: string,
  onImageUpdated: (imageData: string) => void,
  onError?: (message: string) => void
): void {
  onImageUpdated(imageData)
  // 清除错误信息
  onError?.('')
}

/**
 * 处理摄像头错误
 * @param message 错误消息
 * @param onError 错误处理回调
 */
export function handleCameraError(
  message: string,
  onError: (message: string) => void
): void {
  onError(message)
}

/**
 * 切换摄像头状态
 * @param currentActive 当前摄像头状态
 * @param onToggle 状态切换回调
 */
export function toggleCamera(
  currentActive: boolean,
  onToggle: (active: boolean) => void
): void {
  onToggle(!currentActive)
}
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
 * @AIDONE 这个函数已被消除，直接在调用处处理错误逻辑
 * 原函数只是一个简单的包装器，没有提供额外价值，违反了DRY原则
 */

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
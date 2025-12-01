/**
 * 检测是否为移动设备
 * @returns 是否为移动设备
 */
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

/**
 * 检测是否支持原生相机
 * @returns 是否支持原生相机
 */
export function supportsNativeCamera(): boolean {
  const mobile = isMobileDevice()
  const hasCaptureSupport = 'capture' in document.createElement('input')
  return mobile && hasCaptureSupport
}
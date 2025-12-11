/**
 * 图像获取 API
 */

/**
 * 将图像 URL 转换为 base64
 */
export async function fetchImageAsBase64(url: string): Promise<string> {
  const response = await fetch(url)
  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = (): void => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }
      reject(new Error('无法读取图像数据'))
    }
    reader.onerror = (): void => reject(reader.error ?? new Error('FileReader 错误'))
    reader.readAsDataURL(blob)
  })
}
export const downloadCanvasJPG = (canvas: HTMLCanvasElement | null, fileName: string = 'download'): void => {
    if (!canvas) return;
    // Create a JPG URL from the canvas
    const imageUrl = canvas.toDataURL('image/jpeg', 1.0); // 1.0 quality for high quality
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${fileName}.jpg`; // Set the download file name
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * 将 DataURL 转换为 Blob 对象
 * @param dataURL - 图像的 DataURL
 * @returns Blob 对象
 */
export const dataURLToBlob = (dataURL: string): Blob => {
    const arr = dataURL.split(',')
    const mime = arr[0].match(/:(.*?);/)![1]
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n)
    }
    return new Blob([u8arr], { type: mime })
}

/**
 * 保存图像到本地
 * @param imageData - 图像数据，可以是 DataURL 或 Canvas
 * @param fileName - 文件名（不包含扩展名）
 * @param format - 图像格式，默认为 'png'
 */
export const saveImage = (
    imageData: string | HTMLCanvasElement,
    fileName: string = 'image',
    format: 'png' | 'jpg' | 'jpeg' = 'png'
): void => {
    if (!imageData) return

    try {
        let dataURL: string
        let mimeType: string

        if (typeof imageData === 'string') {
            dataURL = imageData
            // 从 DataURL 中提取 MIME 类型
            const match = imageData.match(/data:([^;]+);/)
            mimeType = match ? match[1] : `image/${format}`
        } else {
            // 如果是 Canvas，转换为指定格式的 DataURL
            mimeType = format === 'jpg' || format === 'jpeg' ? 'image/jpeg' : 'image/png'
            const quality = format === 'jpg' || format === 'jpeg' ? 1.0 : undefined
            dataURL = imageData.toDataURL(mimeType, quality)
        }

        const blob = dataURLToBlob(dataURL)
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${fileName}-${Date.now()}.${format}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    } catch (error) {
        console.error('保存图像失败:', error)
    }
}

/**
 * 保存原始图像
 * @param imageData - 图像的 DataURL
 */
export const saveOriginalImage = (imageData: string): void => {
    saveImage(imageData, 'original-image', 'png')
}

/**
 * 保存处理后的图像
 * @param imageData - 图像的 DataURL
 */
export const saveProcessedImage = (imageData: string): void => {
    saveImage(imageData, 'seamless-texture', 'png')
}
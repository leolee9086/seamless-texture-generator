/**
 * 图像处理相关的工具函数
 */

/**
 * 缩放图像到指定最大分辨率
 * @param img 要缩放的图像元素
 * @param maxRes 最大分辨率
 * @returns 包含缩放后图像的canvas元素
 */
export const scaleImageToMaxResolution = (img: HTMLImageElement, maxRes: number): HTMLCanvasElement => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!

    const maxDimension = Math.max(img.width, img.height)

    if (maxDimension <= maxRes) {
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)
        return canvas
    }

    const scale = maxRes / maxDimension
    const newWidth = Math.round(img.width * scale)
    const newHeight = Math.round(img.height * scale)

    canvas.width = newWidth
    canvas.height = newHeight

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    ctx.drawImage(img, 0, 0, newWidth, newHeight)

    return canvas
}

/**
 * 加载图像
 * @param src 图像URL
 * @returns Promise<HTMLImageElement>
 */
export const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = src
    })
}
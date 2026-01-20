/**
 * 图片转换与下载工具
 */

/**
 * 加载图片
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'Anonymous'
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = src
    })
}

/**
 * 触发浏览器下载
 */
export function downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

/**
 * 转换图片格式与尺寸
 */
export interface ConvertOptions {
    format: 'webp' | 'png' | 'jpeg'
    quality: number
    resizeEnabled: boolean
    resizeMode: 'longEdge' | 'shortEdge' | 'width' | 'height' | 'percentage'
    resizeValue: number
}

export async function convertImage(
    source: string | Blob | HTMLImageElement | HTMLCanvasElement,
    options: ConvertOptions
): Promise<Blob> {
    let img: HTMLImageElement | HTMLCanvasElement

    if (source instanceof HTMLCanvasElement) {
        img = source
    } else if (source instanceof HTMLImageElement) {
        img = source
    } else if (source instanceof Blob) {
        const url = URL.createObjectURL(source)
        img = await loadImage(url)
        URL.revokeObjectURL(url)
    } else {
        img = await loadImage(source)
    }

    // 计算目标尺寸
    let targetWidth = img.width
    let targetHeight = img.height

    if (options.resizeEnabled) {
        const ratio = img.width / img.height
        switch (options.resizeMode) {
            case 'longEdge':
                if (img.width > img.height) {
                    targetWidth = Math.min(options.resizeValue, img.width) // 不放大
                    targetHeight = targetWidth / ratio
                } else {
                    targetHeight = Math.min(options.resizeValue, img.height)
                    targetWidth = targetHeight * ratio
                }
                break
            case 'shortEdge':
                if (img.width < img.height) {
                    targetWidth = Math.min(options.resizeValue, img.width)
                    targetHeight = targetWidth / ratio
                } else {
                    targetHeight = Math.min(options.resizeValue, img.height)
                    targetWidth = targetHeight * ratio
                }
                break
            case 'width':
                targetWidth = options.resizeValue
                targetHeight = targetWidth / ratio
                break
            case 'height':
                targetHeight = options.resizeValue
                targetWidth = targetHeight * ratio
                break
            case 'percentage':
                targetWidth = img.width * options.resizeValue / 100
                targetHeight = img.height * options.resizeValue / 100
                break
        }
    }

    // 绘制到 Canvas
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(targetWidth)
    canvas.height = Math.round(targetHeight)
    const ctx = canvas.getContext('2d')!

    // 如果是 webp/png，可能有透明度，不需要填充背景
    // 如果是 jpeg，填充黑色或白色背景? 通常黑色背景比较好识别透明区域
    if (options.format === 'jpeg') {
        ctx.fillStyle = '#000000'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    // 导出
    const mimeType = {
        'webp': 'image/webp',
        'png': 'image/png',
        'jpeg': 'image/jpeg'
    }[options.format]

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) resolve(blob)
                else reject(new Error('Canvas conversion failed'))
            },
            mimeType,
            options.quality
        )
    })
}

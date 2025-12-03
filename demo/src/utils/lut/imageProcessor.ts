import { 获取到指定值的缩放倍数, 缩放到指定倍数并取整 } from './common/scale'

/**
 * 图像数据准备结果
 */
export interface ImageDataResult {
    imageData: ImageData
    scale: number
    targetWidth: number
    targetHeight: number
}

/**
 * 准备图像数据（支持降采样）
 */
export const prepareImageData = async (img: HTMLImageElement, maxDimension: number = 512): Promise<ImageDataResult> => {
    const scale = 获取到指定值的缩放倍数(maxDimension, img.width, img.height)
    const [scaledWidth, scaledHeight] = 缩放到指定倍数并取整(scale, img.width, img.height)

    let targetWidth = img.width
    let targetHeight = img.height
    if (scale < 1) {
        targetWidth = scaledWidth
        targetHeight = scaledHeight
    }

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    canvas.width = targetWidth
    canvas.height = targetHeight
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight)
    const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight)

    return { imageData, scale, targetWidth, targetHeight }
}

/**
 * 预览图像数据结果
 */
export interface PreviewImageDataResult {
    img: HTMLImageElement
    imageData: ImageData
    scale: number
}

/**
 * 创建预览图像数据
 */
export const createPreviewImageData = async (originalImage: string): Promise<PreviewImageDataResult> => {
    // 获取图像数据
    const img = new Image()
    img.src = originalImage
    await new Promise((resolve) => {
        img.onload = resolve
    })

    // 使用降采样数据生成遮罩（与生成色块时相同的降采样策略）
    const maxDimension = 512
    const scale = Math.min(1, maxDimension / Math.max(img.width, img.height))
    const scaledWidth = Math.round(img.width * scale)
    const scaledHeight = Math.round(img.height * scale)

    let imageData: ImageData

    if (scale < 1) {
        // 使用降采样数据
        const scaledCanvas = document.createElement('canvas')
        const scaledCtx = scaledCanvas.getContext('2d')!
        scaledCanvas.width = scaledWidth
        scaledCanvas.height = scaledHeight
        scaledCtx.drawImage(img, 0, 0, scaledWidth, scaledHeight)
        imageData = scaledCtx.getImageData(0, 0, scaledWidth, scaledHeight)
    } else {
        // 使用原始数据
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)
        imageData = ctx.getImageData(0, 0, img.width, img.height)
    }

    return { img, imageData, scale }
}

/**
 * 遮罩数据范围信息
 */
interface MaskRange {
    minValue: number
    maxValue: number
    range: number
    maskScale: number
}

/**
 * 计算遮罩数据的范围信息
 */
const computeMaskRange = (finalMask: Uint8Array): MaskRange => {
    let minValue = 255
    let maxValue = 0

    for (let i = 0; i < finalMask.length; i++) {
        minValue = Math.min(minValue, finalMask[i])
        maxValue = Math.max(maxValue, finalMask[i])
    }

    const range = maxValue - minValue
    const maskScale = range > 0 ? 255 / range : 1

    return { minValue, maxValue, range, maskScale }
}

/**
 * 计算图像缩放比例
 */
const computeImageScale = (img: HTMLImageElement, canvasWidth: number, canvasHeight: number) => {
    const scaleX = img.width / canvasWidth
    const scaleY = img.height / canvasHeight
    return { scaleX, scaleY }
}

/**
 * 计算归一化的遮罩值
 */
const computeNormalizedMaskValue = (
    rawMaskValue: number,
    maskRange: MaskRange
): number => {
    const { minValue, range, maskScale } = maskRange
    const normalizedMaskValue = range > 0 ? (rawMaskValue - minValue) * maskScale : rawMaskValue
    return normalizedMaskValue / 255
}

/**
 * 设置遮罩像素的RGBA值
 */
const setMaskPixelRGBA = (
    imageData: ImageData,
    index: number,
    maskValue: number
): void => {
    imageData.data[index] = 255       // R
    imageData.data[index + 1] = 0     // G
    imageData.data[index + 2] = 0     // B
    imageData.data[index + 3] = Math.round(maskValue * 128) // A
}

/**
 * 创建遮罩预览数据
 */
export const createMaskPreviewData = (
    finalMask: Uint8Array,
    img: HTMLImageElement,
    canvasWidth: number,
    canvasHeight: number
): ImageData => {
    const maskRange = computeMaskRange(finalMask)
    const { scaleX, scaleY } = computeImageScale(img, canvasWidth, canvasHeight)
    const maskImageData = new ImageData(canvasWidth, canvasHeight)

    // 遍历预览画布的每个像素
    for (let y = 0; y < canvasHeight; y++) {
        for (let x = 0; x < canvasWidth; x++) {
            // 计算对应的原图像素位置
            const srcX = Math.floor(x * scaleX)
            const srcY = Math.floor(y * scaleY)
            
            // 边界检查
            if (srcX >= img.width || srcY >= img.height) {
                continue
            }
            
            // finalMask 是 RGBA 格式，需要取 R 通道值
            const srcIndex = (srcY * img.width + srcX) * 4
            const rawMaskValue = finalMask[srcIndex] // 取 R 通道值
            
            // 预览时使用反转的蒙版值
            const invertedMaskValue = 255 - rawMaskValue
            const maskValue = computeNormalizedMaskValue(invertedMaskValue, maskRange)

            // 计算预览画布的像素索引
            const dstIndex = (y * canvasWidth + x) * 4

            // 设置RGBA值（半透明红色）
            setMaskPixelRGBA(maskImageData, dstIndex, maskValue)
        }
    }

    return maskImageData
}

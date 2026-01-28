/**
 * 水印渲染器
 * 使用 Canvas API 在图像上添加水印
 */
import type { 水印配置, 水印渲染上下文 } from './watermark.types'
import {
    IMAGE_MIME_TYPE_PNG,
    ERROR_CANVAS_CONTEXT_FAILED,
    ERROR_IMAGE_LOAD_FAILED,
    ERROR_CANVAS_TO_BLOB_FAILED,
    TEXT_ALIGN_CENTER,
    TEXT_BASELINE_MIDDLE
} from './watermark.constants'
import { 生成字体样式 } from './watermark.templates'

/**
 * 在 Canvas 上应用水印
 * @param canvas 目标 Canvas
 * @param config 水印配置
 */
export function 应用水印(canvas: HTMLCanvasElement, config: 水印配置): void {
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const renderCtx: 水印渲染上下文 = {
        ctx,
        width: canvas.width,
        height: canvas.height,
        config
    }

    if (config.样式 === 'grid') {
        渲染网格水印(renderCtx)
        return
    }
    渲染居中水印(renderCtx)
}

/**
 * 将 Canvas 转换为 Blob URL
 * 使用 toBlob 替代 toDataURL 以提高性能
 */
function canvasToBlobUrl(canvas: HTMLCanvasElement): Promise<string> {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error(ERROR_CANVAS_TO_BLOB_FAILED))
                return
            }
            resolve(URL.createObjectURL(blob))
        }, IMAGE_MIME_TYPE_PNG)
    })
}

/**
 * 将图片 URL（Base64 或 Blob URL）添加水印后返回新的 Blob URL
 * @param imageUrl 图片 URL（支持 Base64 或 Blob URL）
 * @param config 水印配置
 * @returns 带水印的图片 Blob URL
 */
export async function 添加水印到图片(
    imageUrl: string,
    config: 水印配置
): Promise<string> {
    const img = await loadImage(imageUrl)
    
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height

    const ctx = canvas.getContext('2d')
    if (!ctx) {
        throw new Error(ERROR_CANVAS_CONTEXT_FAILED)
    }

    ctx.drawImage(img, 0, 0)
    应用水印(canvas, config)

    return canvasToBlobUrl(canvas)
}

/**
 * 加载图片
 * @param imageUrl 图片 URL
 * @returns 加载完成的 HTMLImageElement
 */
function loadImage(imageUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = (): void => resolve(img)
        img.onerror = (): void => reject(new Error(ERROR_IMAGE_LOAD_FAILED))
        img.src = imageUrl
    })
}

/**
 * 设置水印文本样式
 */
function 设置水印文本样式(renderCtx: 水印渲染上下文): void {
    const { ctx, config } = renderCtx
    ctx.font = 生成字体样式(config.字体大小)
    ctx.fillStyle = config.颜色
    ctx.globalAlpha = config.不透明度
    ctx.textAlign = TEXT_ALIGN_CENTER
    ctx.textBaseline = TEXT_BASELINE_MIDDLE
}

/**
 * 渲染 45 度网格水印
 */
function 渲染网格水印(renderCtx: 水印渲染上下文): void {
    const { ctx, width, height, config } = renderCtx
    ctx.save()

    设置水印文本样式(renderCtx)

    const 间距 = config.网格间距
    const 对角线长度 = Math.sqrt(width * width + height * height)
    const 行数 = Math.ceil(对角线长度 / 间距) * 2
    const 列数 = Math.ceil(对角线长度 / 间距) * 2

    ctx.translate(width / 2, height / 2)
    ctx.rotate(-Math.PI / 4) // 45度

    for (let row = -行数; row <= 行数; row++) {
        for (let col = -列数; col <= 列数; col++) {
            const x = col * 间距
            const y = row * 间距
            ctx.fillText(config.文本, x, y)
        }
    }

    ctx.restore()
}

/**
 * 渲染居中水印
 */
function 渲染居中水印(renderCtx: 水印渲染上下文): void {
    const { ctx, width, height, config } = renderCtx
    ctx.save()

    设置水印文本样式(renderCtx)
    ctx.fillText(config.文本, width / 2, height / 2)

    ctx.restore()
}

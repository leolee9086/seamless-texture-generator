/**
 * 水印渲染器
 * 使用 Canvas API 在图像上添加水印
 */
import type { 水印配置 } from './watermark.types'

/**
 * 在 Canvas 上应用水印
 * @param canvas 目标 Canvas
 * @param config 水印配置
 */
export function 应用水印(canvas: HTMLCanvasElement, config: 水印配置): void {
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (config.样式 === 'grid') {
        渲染网格水印(ctx, canvas.width, canvas.height, config)
    } else {
        渲染居中水印(ctx, canvas.width, canvas.height, config)
    }
}

/**
 * 将 base64 图片添加水印后返回新的 base64
 */
export async function 添加水印到图片(
    base64: string,
    config: 水印配置
): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
            const canvas = document.createElement('canvas')
            canvas.width = img.width
            canvas.height = img.height

            const ctx = canvas.getContext('2d')
            if (!ctx) {
                reject(new Error('无法获取 Canvas 上下文'))
                return
            }

            ctx.drawImage(img, 0, 0)
            应用水印(canvas, config)

            resolve(canvas.toDataURL('image/png'))
        }
        img.onerror = () => reject(new Error('图片加载失败'))
        img.src = base64
    })
}

/**
 * 渲染 45 度网格水印
 */
function 渲染网格水印(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    config: 水印配置
): void {
    ctx.save()

    ctx.font = `${config.字体大小}px Arial, sans-serif`
    ctx.fillStyle = config.颜色
    ctx.globalAlpha = config.不透明度
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

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
function 渲染居中水印(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    config: 水印配置
): void {
    ctx.save()

    ctx.font = `${config.字体大小}px Arial, sans-serif`
    ctx.fillStyle = config.颜色
    ctx.globalAlpha = config.不透明度
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    ctx.fillText(config.文本, width / 2, height / 2)

    ctx.restore()
}

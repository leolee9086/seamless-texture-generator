/**
 * 一些工具函数,用于缩放画布,非纯函数
 */
import type { 缩放画布执行细节 } from './scale.types'
import { CANVAS_CONTEXT_2D, ERROR_GET_CONTEXT_FAILED } from './scale.constants'

/**
 * 通用画布缩放函数，应用DRY原则减少重复代码
 * @param canvas 要缩放的画布元素
 * @param scale 计算好的缩放比例
 * @returns 缩放操作的执行细节
 */
const 缩放画布 = (canvas: HTMLCanvasElement, scale: number): 缩放画布执行细节 => {
    const ctx = canvas.getContext(CANVAS_CONTEXT_2D)
    if (!ctx) throw new Error(ERROR_GET_CONTEXT_FAILED)
    
    const { width, height } = canvas
    const resultWidth = Math.round(width * scale)
    const resultHeight = Math.round(height * scale)
    
    canvas.width = resultWidth
    canvas.height = resultHeight
    
    // 非纯函数仅仅返回成功或者失败以及执行细节,但是不隐藏错误,直接抛出
    return {
        success: true,
        detail: {
            ratio: scale,
            resultWidth,
            resultHeight,
            originalWidth: width,
            originalHeight: height
        }
    }
}

/**
 * 按照最大尺寸缩放现有画布
 * @param canvas 要缩放的画布元素
 * @param maxWidth 最大宽度限制
 * @param maxHeight 最大高度限制
 * @returns 缩放操作的执行细节
 */
export const 按照最大尺寸缩放现有画布 = (canvas: HTMLCanvasElement, maxWidth: number, maxHeight: number): 缩放画布执行细节 => {
    const { width, height } = canvas
    // 计算缩放比例，但限制最大为1，确保不会放大图像
    const scale = Math.min(1, Math.min(maxWidth / width, maxHeight / height))
    return 缩放画布(canvas, scale)
}

/**
 * 按照最大宽度缩放现有画布
 * @param canvas 要缩放的画布元素
 * @param maxWidth 最大宽度限制
 * @returns 缩放操作的执行细节
 */
export const 按照最大宽度缩放现有画布 = (canvas: HTMLCanvasElement, maxWidth: number): 缩放画布执行细节 => {
    const { width } = canvas
    // 计算缩放比例，但限制最大为1，确保不会放大图像
    const scale = Math.min(1, maxWidth / width)
    return 缩放画布(canvas, scale)
}

/**
 * 按照最大高度缩放现有画布
 * @param canvas 要缩放的画布元素
 * @param maxHeight 最大高度限制
 * @returns 缩放操作的执行细节
 */
export const 按照最大高度缩放现有画布 = (canvas: HTMLCanvasElement, maxHeight: number): 缩放画布执行细节 => {
    const { height } = canvas
    // 计算缩放比例，但限制最大为1，确保不会放大图像
    const scale = Math.min(1, maxHeight / height)
    return 缩放画布(canvas, scale)
}

/**
 * 一些工具函数,用于缩放画布,非纯函数
 */
interface 缩放画布执行细节 {
    //操作是否成功
    success: boolean,
    //操作细节
    detail: {
        //缩放比例
        ratio: number,
        //结果宽度
        resultWidth: number,
        //结果高度
        resultHeight: number,
        //原始宽度
        originalWidth: number,
        //原始高度
        originalHeight: number
    }
}
export const 按照最大尺寸缩放现有画布 = (canvas: HTMLCanvasElement, maxWidth: number, maxHeight: number): 缩放画布执行细节 => {
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('获取画布上下文失败')
    const { width, height } = canvas
    // 计算缩放比例，但限制最大为1，确保不会放大图像
    const scale = Math.min(1, Math.min(maxWidth / width, maxHeight / height))
    canvas.width = Math.round(width * scale)
    canvas.height = Math.round(height * scale)
    //非纯函数仅仅返回成功或者失败以及执行细节,但是不隐藏错误,直接抛出
    return {
        success: true,
        detail: {
            ratio: scale,
            resultWidth: canvas.width,
            resultHeight: canvas.height,
            originalWidth: width,
            originalHeight: height
        }
    }
}
export const 按照最大宽度缩放现有画布 = (canvas: HTMLCanvasElement, maxWidth: number): 缩放画布执行细节 => {
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('获取画布上下文失败')
    const { width, height } = canvas
    // 计算缩放比例，但限制最大为1，确保不会放大图像
    const scale = Math.min(1, maxWidth / width)
    canvas.width = Math.round(width * scale)
    canvas.height = Math.round(height * scale)
    //非纯函数仅仅返回成功或者失败,但是不隐藏错误,直接抛出
    return {
        success: true,
        detail: {
            ratio: scale,
            resultWidth: canvas.width,
            resultHeight: canvas.height,
            originalWidth: width,
            originalHeight: height
        }
    }
}
export const 按照最大高度缩放现有画布 = (canvas: HTMLCanvasElement, maxHeight: number): 缩放画布执行细节 => {
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('获取画布上下文失败')
    const { width, height } = canvas
    // 计算缩放比例，但限制最大为1，确保不会放大图像
    const scale = Math.min(1, maxHeight / height)
    canvas.width = Math.round(width * scale)
    canvas.height = Math.round(height * scale)
    //非纯函数仅仅返回成功或者失败,但是不隐藏错误,直接抛出
    return {
        success: true,
        detail: {
            ratio: scale,
            resultWidth: canvas.width,
            resultHeight: canvas.height,
            originalWidth: width,
            originalHeight: height
        }
    }
}

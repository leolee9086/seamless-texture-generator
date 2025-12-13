/**
 * 将ImageData绘制到Canvas上，支持指定混合模式
 * @param imageData 要绘制的图像数据
 * @param canvas 目标画布
 * @param miscMode 全局合成操作模式，默认为'source-over'
 * @throws {Error} 当无法获取2D上下文时抛出错误
 */
export const 将ImageData绘制到Canvas = (
    imageData: ImageData,
    canvas: HTMLCanvasElement,
    miscMode: GlobalCompositeOperation = 'source-over'
): void => {
    // 输入参数验证
    if (!imageData) {
        throw new Error('ImageData参数不能为空')
    }
    if (!canvas) {
        throw new Error('Canvas参数不能为空')
    }
    
    const tempCanvas = document.createElement('canvas')
    const tempCtx = tempCanvas.getContext('2d')
    if (!tempCtx) {
        throw new Error('无法获取临时画布的2D渲染上下文')
    }
    
    tempCanvas.width = canvas.width
    tempCanvas.height = canvas.height
    tempCtx.putImageData(imageData, 0, 0)
    
    const ctx = canvas.getContext('2d')
    if (!ctx) {
        throw new Error('无法获取目标画布的2D渲染上下文')
    }
    
    // 先获取目标画布的绘制模式
    const currentMode = ctx.globalCompositeOperation
    ctx.globalCompositeOperation = miscMode
    ctx.drawImage(tempCanvas, 0, 0)
    // 还原绘制模式
    ctx.globalCompositeOperation = currentMode
}

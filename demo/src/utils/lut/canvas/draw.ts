export const 将ImageData绘制到Canvas = (
    imageData: ImageData,
    canvas: HTMLCanvasElement,
    miscMode: GlobalCompositeOperation = 'source-over'
) => {
    const tempCanvas = document.createElement('canvas')
    const tempCtx = tempCanvas.getContext('2d')!
    tempCanvas.width = canvas.width
    tempCanvas.height = canvas.height
    tempCtx.putImageData(imageData, 0, 0)
    const ctx = canvas.getContext('2d')!
    //先获取目标画布的绘制模式
    const currentMode = ctx.globalCompositeOperation
    ctx.globalCompositeOperation = miscMode
    ctx.drawImage(tempCanvas, 0, 0)
    //还原绘制模式
    ctx.globalCompositeOperation = currentMode
}

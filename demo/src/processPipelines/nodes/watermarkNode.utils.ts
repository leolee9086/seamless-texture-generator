/**
 * 水印节点工具函数
 * GPUBuffer 和 Canvas 之间的转换
 */
import type { BufferToCanvasContext, CanvasToBufferContext } from './watermarkNode.types'

/** GPU Buffer 使用标志常量 */
const GPU_BUFFER_USAGE = {
    READ: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    STORAGE: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST
} as const

/**
 * @简洁函数 创建 Canvas 元素
 */
function createCanvas(width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    return canvas
}

/** 将 GPUBuffer 转为 Canvas */
export async function gpuBufferToCanvas(ctx: BufferToCanvasContext): Promise<HTMLCanvasElement> {
    const { buffer, width, height, device } = ctx
    const canvas = createCanvas(width, height)
    const ctx2d = canvas.getContext('2d')!

    if (buffer instanceof GPUBuffer) {
        const size = width * height * 4
        const readBuffer = device.createBuffer({
            size,
            usage: GPU_BUFFER_USAGE.READ
        })

        const commandEncoder = device.createCommandEncoder()
        commandEncoder.copyBufferToBuffer(buffer, 0, readBuffer, 0, size)
        device.queue.submit([commandEncoder.finish()])

        await readBuffer.mapAsync(GPUMapMode.READ)
        const data = new Uint8ClampedArray(readBuffer.getMappedRange().slice(0))
        readBuffer.unmap()
        readBuffer.destroy()

        const imageData = new ImageData(data, width, height)
        ctx2d.putImageData(imageData, 0, 0)
    }

    return canvas
}

/** 将 Canvas 转回 GPUBuffer */
export async function canvasToGpuBuffer(ctx: CanvasToBufferContext): Promise<GPUBuffer> {
    const { canvas, device } = ctx
    const ctx2d = canvas.getContext('2d')!
    const imageData = ctx2d.getImageData(0, 0, canvas.width, canvas.height)

    const buffer = device.createBuffer({
        size: imageData.data.byteLength,
        usage: GPU_BUFFER_USAGE.STORAGE,
        mappedAtCreation: true
    })

    new Uint8Array(buffer.getMappedRange()).set(imageData.data)
    buffer.unmap()

    return buffer
}

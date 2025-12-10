/**
 * 图像处理管线工具函数
 */

/**
 * 工具函数：ImageData 转 GPUBuffer
 */
export async function imageDataToGPUBuffer(imageData: ImageData, device: GPUDevice): Promise<GPUBuffer> {
    const buffer = device.createBuffer({
        size: imageData.data.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true
    })
    new Uint8Array(buffer.getMappedRange()).set(imageData.data)
    buffer.unmap()
    return buffer
}

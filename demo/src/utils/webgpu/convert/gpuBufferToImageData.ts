/**
 * 工具函数：GPUBuffer | GPUTexture 转 ImageData
 */
export async function gpuBufferToImageData(buffer: GPUBuffer | GPUTexture, width: number, height: number, device: GPUDevice): Promise<ImageData> {
  const size = width * height * 4;
  const stagingBuffer = device.createBuffer({
    size,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
  });

  const commandEncoder = device.createCommandEncoder();

  if (buffer instanceof GPUBuffer) {
    // 直接从GPUBuffer复制
    commandEncoder.copyBufferToBuffer(buffer, 0, stagingBuffer, 0, size);
  } else {
    // 从GPUTexture复制，需要创建临时缓冲区来处理对齐
    const alignment = 256;
    const bytesPerRow = width * 4;
    const alignedBytesPerRow = Math.ceil(bytesPerRow / alignment) * alignment;
    const alignedBufferSize = alignedBytesPerRow * height;

    const tempBuffer = device.createBuffer({
      size: alignedBufferSize,
      usage: GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST
    });

    commandEncoder.copyTextureToBuffer(
      { texture: buffer },
      { buffer: tempBuffer, bytesPerRow: alignedBytesPerRow },
      { width, height }
    );

    // 从对齐的缓冲区复制到紧凑的缓冲区
    commandEncoder.copyBufferToBuffer(tempBuffer, 0, stagingBuffer, 0, size);

    tempBuffer.destroy();
  }

  device.queue.submit([commandEncoder.finish()]);

  await stagingBuffer.mapAsync(GPUMapMode.READ);
  const copyArrayBuffer = stagingBuffer.getMappedRange();
  const data = new Uint8ClampedArray(copyArrayBuffer.slice(0));
  stagingBuffer.unmap();
  stagingBuffer.destroy();

  return new ImageData(data, width, height);
}

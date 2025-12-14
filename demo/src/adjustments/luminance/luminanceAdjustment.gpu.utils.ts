/**
 * Luminance Adjustment GPU Utilities
 * 亮度调整GPU底层工具函数
 */

import type { LuminanceAdjustmentParams } from './imports';
import { WebGPULuminanceProcessor } from './imports';

/**
 * 写入ImageData到GPU纹理
 */
export async function 写入ImageData到纹理(options: {
    device: GPUDevice;
    imageData: ImageData;
    texture: GPUTexture;
}): Promise<GPUBuffer> {
    const { device, imageData, texture } = options;
    // 计算对齐的bytesPerRow (必须是256的倍数)
    const alignment = 256;
    const bytesPerRow = imageData.width * 4;
    const alignedBytesPerRow = Math.ceil(bytesPerRow / alignment) * alignment;

    const dataBuffer = device.createBuffer({
        size: alignedBytesPerRow * imageData.height,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
        mappedAtCreation: true
    });

    // Copy data to aligned buffer
    const mappedRange = new Uint8Array(dataBuffer.getMappedRange());
    for (let y = 0; y < imageData.height; y++) {
        const srcOffset = y * bytesPerRow;
        const dstOffset = y * alignedBytesPerRow;
        mappedRange.set(
            imageData.data.subarray(srcOffset, srcOffset + bytesPerRow),
            dstOffset
        );
    }
    dataBuffer.unmap();

    const commandEncoder = device.createCommandEncoder();
    commandEncoder.copyBufferToTexture(
        {
            buffer: dataBuffer,
            bytesPerRow: alignedBytesPerRow
        },
        { texture },
        { width: imageData.width, height: imageData.height }
    );
    device.queue.submit([commandEncoder.finish()]);

    return dataBuffer;
}

/**
 * 从GPU纹理读取ImageData
 */
export async function 从纹理读取ImageData(options: {
    device: GPUDevice;
    texture: GPUTexture;
    width: number;
    height: number;
}): Promise<ImageData> {
    const { device, texture, width, height } = options;
    // 计算对齐的bytesPerRow
    const alignment = 256;
    const bytesPerRow = width * 4;
    const alignedBytesPerRow = Math.ceil(bytesPerRow / alignment) * alignment;

    const readbackBuffer = device.createBuffer({
        size: alignedBytesPerRow * height,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    });

    const readEncoder = device.createCommandEncoder();
    readEncoder.copyTextureToBuffer(
        { texture },
        { buffer: readbackBuffer, bytesPerRow: alignedBytesPerRow },
        { width, height }
    );
    device.queue.submit([readEncoder.finish()]);

    // Map buffer and extract actual data
    await readbackBuffer.mapAsync(GPUMapMode.READ);
    const mappedData = new Uint8Array(readbackBuffer.getMappedRange());

    // Extract data from aligned buffer
    const resultData = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y++) {
        const srcOffset = y * alignedBytesPerRow;
        const dstOffset = y * bytesPerRow;
        resultData.set(
            mappedData.subarray(srcOffset, srcOffset + bytesPerRow),
            dstOffset
        );
    }
    readbackBuffer.unmap();
    readbackBuffer.destroy();

    return new ImageData(resultData, width, height);
}

/**
 * Apply luminance adjustment to ImageData using WebGPU
 */
export async function applyLuminanceAdjustmentToImageData(
    device: GPUDevice,
    imageData: ImageData,
    params: LuminanceAdjustmentParams
): Promise<ImageData> {
    // Create temporary textures for processing
    const textureDescriptor: GPUTextureDescriptor = {
        size: { width: imageData.width, height: imageData.height },
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC | GPUTextureUsage.STORAGE_BINDING
    };

    const inputTexture = device.createTexture(textureDescriptor);
    const outputTexture = device.createTexture(textureDescriptor);

    // Write image data to input texture
    const dataBuffer = await 写入ImageData到纹理({ device, imageData, texture: inputTexture });

    // Process image
    const processor = new WebGPULuminanceProcessor(device);
    await processor.initialize();
    const processEncoder = await processor.processImage(inputTexture, outputTexture, params);
    device.queue.submit([processEncoder.finish()]);

    // Read back the result
    const result = await 从纹理读取ImageData({ device, texture: outputTexture, width: imageData.width, height: imageData.height });

    // Clean up
    inputTexture.destroy();
    outputTexture.destroy();
    dataBuffer.destroy();
    processor.destroy();

    return result;
}


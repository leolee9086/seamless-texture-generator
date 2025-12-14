/**
 * WebGPU Texture Utilities
 */

export async function loadTexture(device: GPUDevice, source: ImageBitmap | HTMLImageElement): Promise<GPUTexture> {
    const bitmap = source instanceof ImageBitmap ? source : await createImageBitmap(source);

    const texture = device.createTexture({
        size: [bitmap.width, bitmap.height],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
    });

    device.queue.copyExternalImageToTexture(
        { source: bitmap },
        { texture },
        [bitmap.width, bitmap.height]
    );

    return texture;
}

export function createOutputTexture(device: GPUDevice, width: number, height: number): GPUTexture {
    return device.createTexture({
        size: [width, height],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.TEXTURE_BINDING
    });
}

export async function copyTextureToCanvas(device: GPUDevice, texture: GPUTexture, canvas: HTMLCanvasElement) {
    const width = texture.width;
    const height = texture.height;

    // Ensure canvas size matches
    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
    }

    const bytesPerRow = Math.ceil(width * 4 / 256) * 256;
    const bufferSize = bytesPerRow * height;

    const readBuffer = device.createBuffer({
        size: bufferSize,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    });

    const encoder = device.createCommandEncoder();
    encoder.copyTextureToBuffer(
        { texture },
        { buffer: readBuffer, bytesPerRow },
        [width, height]
    );
    device.queue.submit([encoder.finish()]);

    await readBuffer.mapAsync(GPUMapMode.READ);
    const data = new Uint8Array(readBuffer.getMappedRange());

    const ctx = canvas.getContext('2d');
    if (ctx) {
        const imageData = ctx.createImageData(width, height);
        for (let y = 0; y < height; y++) {
            const srcRowOffset = y * bytesPerRow;
            const dstRowOffset = y * width * 4;
            // 逐行复制以处理 bytesPerRow padding
            // Use subarray for faster copy if possible, but row-by-row is safe
            const rowData = data.subarray(srcRowOffset, srcRowOffset + width * 4);
            imageData.data.set(rowData, dstRowOffset);
        }
        ctx.putImageData(imageData, 0, 0);
    }

    readBuffer.unmap();
    readBuffer.destroy();
}

/**
 * Luminance Adjustment Utilities
 * Provides functions for managing luminance-based adjustments (Shadows, Midtones, Highlights)
 */

import type { LuminanceAdjustmentParams, ZoneAdjustment } from '../utils/webgpu/luminance.types';
import type { LuminancePreset } from './luminanceAdjustment.types';
import { WebGPULuminanceProcessor, processLuminanceAdjustment } from '../utils/webgpu/luminance-processor.class';
import { 验证错误消息 } from './luminanceAdjustment.templates';

// Default parameters for luminance adjustment
export const DEFAULT_LUMINANCE_PARAMS: LuminanceAdjustmentParams = {
    shadows: {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        red: 0,
        green: 0,
        blue: 0
    },
    midtones: {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        red: 0,
        green: 0,
        blue: 0
    },
    highlights: {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        red: 0,
        green: 0,
        blue: 0
    },
    shadowEnd: 0.33,
    highlightStart: 0.66,
    softness: 0.1
};

// Presets for common adjustments
export const LUMINANCE_PRESETS = {
    default: {
        name: '默认',
        params: { ...DEFAULT_LUMINANCE_PARAMS }
    },
    enhanceShadows: {
        name: '增强阴影',
        params: {
            ...DEFAULT_LUMINANCE_PARAMS,
            shadows: {
                brightness: 0.2,
                contrast: 0.1,
                saturation: 0.1,
                red: 0,
                green: 0,
                blue: 0
            }
        }
    },
    enhanceHighlights: {
        name: '增强高光',
        params: {
            ...DEFAULT_LUMINANCE_PARAMS,
            highlights: {
                brightness: -0.1,
                contrast: 0.1,
                saturation: 0.05,
                red: 0,
                green: 0,
                blue: 0
            }
        }
    },
    popColors: {
        name: '色彩鲜艳',
        params: {
            ...DEFAULT_LUMINANCE_PARAMS,
            shadows: {
                brightness: 0.1,
                contrast: 0,
                saturation: 0.2,
                red: 0,
                green: 0,
                blue: 0
            },
            midtones: {
                brightness: 0,
                contrast: 0.1,
                saturation: 0.3,
                red: 0,
                green: 0,
                blue: 0
            },
            highlights: {
                brightness: 0,
                contrast: 0,
                saturation: 0.1,
                red: 0,
                green: 0,
                blue: 0
            }
        }
    },
    contrastBoost: {
        name: '对比度增强',
        params: {
            ...DEFAULT_LUMINANCE_PARAMS,
            shadows: {
                brightness: -0.05,
                contrast: 0.2,
                saturation: 0,
                red: 0,
                green: 0,
                blue: 0
            },
            midtones: {
                brightness: 0,
                contrast: 0.3,
                saturation: 0,
                red: 0,
                green: 0,
                blue: 0
            },
            highlights: {
                brightness: 0.05,
                contrast: 0.2,
                saturation: 0,
                red: 0,
                green: 0,
                blue: 0
            }
        }
    },
    warmTones: {
        name: '暖色调',
        params: {
            ...DEFAULT_LUMINANCE_PARAMS,
            shadows: {
                brightness: 0,
                contrast: 0,
                saturation: 0.1,
                red: 0.05,
                green: 0.02,
                blue: -0.05
            },
            midtones: {
                brightness: 0,
                contrast: 0,
                saturation: 0.1,
                red: 0.08,
                green: 0.03,
                blue: -0.08
            },
            highlights: {
                brightness: 0,
                contrast: 0,
                saturation: 0.05,
                red: 0.05,
                green: 0,
                blue: -0.05
            }
        }
    },
    coolTones: {
        name: '冷色调',
        params: {
            ...DEFAULT_LUMINANCE_PARAMS,
            shadows: {
                brightness: 0,
                contrast: 0,
                saturation: 0.1,
                red: -0.05,
                green: 0,
                blue: 0.05
            },
            midtones: {
                brightness: 0,
                contrast: 0,
                saturation: 0.1,
                red: -0.08,
                green: 0,
                blue: 0.08
            },
            highlights: {
                brightness: 0,
                contrast: 0,
                saturation: 0.05,
                red: -0.05,
                green: 0,
                blue: 0.05
            }
        }
    }
};



// Get preset by key
export function getLuminancePreset(preset: LuminancePreset): LuminanceAdjustmentParams {
    return LUMINANCE_PRESETS[preset].params;
}

// Validate parameters
export function validateLuminanceParams(params: LuminanceAdjustmentParams): {
    isValid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    // Validate zone parameters
    for (const zone of ['shadows', 'midtones', 'highlights'] as const) {
        const zoneParams = params[zone] as ZoneAdjustment;

        if (zoneParams.brightness < -1.0 || zoneParams.brightness > 1.0) {
            errors.push(验证错误消息.zone参数.brightness超出范围(zone));
        }

        if (zoneParams.contrast < -1.0 || zoneParams.contrast > 1.0) {
            errors.push(验证错误消息.zone参数.contrast超出范围(zone));
        }

        if (zoneParams.saturation < -1.0 || zoneParams.saturation > 1.0) {
            errors.push(验证错误消息.zone参数.saturation超出范围(zone));
        }

        if (zoneParams.red < -1.0 || zoneParams.red > 1.0) {
            errors.push(验证错误消息.zone参数.red超出范围(zone));
        }

        if (zoneParams.green < -1.0 || zoneParams.green > 1.0) {
            errors.push(验证错误消息.zone参数.green超出范围(zone));
        }

        if (zoneParams.blue < -1.0 || zoneParams.blue > 1.0) {
            errors.push(验证错误消息.zone参数.blue超出范围(zone));
        }
    }

    // Validate range parameters
    if (params.shadowEnd < 0.0 || params.shadowEnd > 1.0) {
        errors.push(验证错误消息.范围参数.shadowEnd超出范围);
    }

    if (params.highlightStart < 0.0 || params.highlightStart > 1.0) {
        errors.push(验证错误消息.范围参数.highlightStart超出范围);
    }

    if (params.shadowEnd >= params.highlightStart) {
        errors.push(验证错误消息.范围参数.shadowEnd必须小于highlightStart);
    }

    if (params.softness < 0.0 || params.softness > 1.0) {
        errors.push(验证错误消息.范围参数.softness超出范围);
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

// Create control event for luminance adjustment
export function createLuminanceAdjustmentEvent(params: LuminanceAdjustmentParams): {
    type: 'update-data';
    detail: {
        action: 'luminance-adjustment';
        data: LuminanceAdjustmentParams;
    };
} {
    return {
        type: 'update-data' as const,
        detail: {
            action: 'luminance-adjustment',
            data: params
        }
    };
}

// Apply luminance adjustment to image using WebGPU
export async function applyLuminanceAdjustment(
    device: GPUDevice,
    inputTexture: GPUTexture,
    outputTexture: GPUTexture,
    params: LuminanceAdjustmentParams
): Promise<void> {
    await processLuminanceAdjustment(device, inputTexture, outputTexture, params);
}

/**
 * 写入ImageData到GPU纹理
 */
async function 写入ImageData到纹理(options: {
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
async function 从纹理读取ImageData(options: {
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

// Apply luminance adjustment to ImageData using WebGPU
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
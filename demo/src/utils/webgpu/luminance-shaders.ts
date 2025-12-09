/**
 * Luminance-based Adjustment WebGPU Compute Shaders
 * Implements Shadows, Midtones, and Highlights adjustments
 */

import {
    ZONE_PARAMS_STRUCT,
    LUMINANCE_PARAMS_STRUCT,
    BINDINGS,
    GET_LUMINANCE_FN,
    RGB_TO_HSL_FN,
    HUE2RGB_FN,
    HSL_TO_RGB_FN,
    APPLY_ADJUSTMENTS_FN,
    MAIN_FN_TEMPLATE
} from './luminance.code';
import type { LuminanceAdjustmentParams } from './luminance.types';

/**
 * 创建亮度调整计算着色器代码
 * @param workgroupSizeX X轴工作组大小
 * @param workgroupSizeY Y轴工作组大小
 * @returns 完整的WGSL着色器代码
 */
export const luminanceComputeShaderTemplate = (workgroupSizeX: number, workgroupSizeY: number): string => {
    const shaderParts = [
        ZONE_PARAMS_STRUCT,
        LUMINANCE_PARAMS_STRUCT,
        BINDINGS,
        GET_LUMINANCE_FN,
        RGB_TO_HSL_FN,
        HUE2RGB_FN,
        HSL_TO_RGB_FN,
        APPLY_ADJUSTMENTS_FN,
        MAIN_FN_TEMPLATE(workgroupSizeX, workgroupSizeY)
    ];
    
    return shaderParts.join('\n');
};

export const luminanceComputeShader: string = luminanceComputeShaderTemplate(16, 16);

/**
 * 创建亮度调整计算着色器模块
 * @param device GPU设备
 * @returns 着色器模块
 */
export function createLuminanceComputeShader(device: GPUDevice): GPUShaderModule {
    return device.createShaderModule({
        code: luminanceComputeShader,
        label: 'Luminance Adjustment Compute Shader'
    });
}


/**
 * 创建亮度调整参数缓冲区
 * @param params 亮度调整参数
 * @returns 格式化的Float32Array缓冲区
 */
export function createLuminanceParamsBuffer(params: LuminanceAdjustmentParams): Float32Array {
    // 3 zones * 8 floats + 4 floats = 28 floats -> 112 bytes
    // Aligned to 16 bytes? Yes, 112 is divisible by 16 (7 * 16).
    const data = new Float32Array(32); // Use 32 floats (128 bytes) to be safe and aligned

    let offset = 0;

    // Shadows
    data[offset++] = params.shadows.brightness;
    data[offset++] = params.shadows.contrast;
    data[offset++] = params.shadows.saturation;
    data[offset++] = params.shadows.red;
    data[offset++] = params.shadows.green;
    data[offset++] = params.shadows.blue;
    data[offset++] = 0; // padding
    data[offset++] = 0; // padding

    // Midtones
    data[offset++] = params.midtones.brightness;
    data[offset++] = params.midtones.contrast;
    data[offset++] = params.midtones.saturation;
    data[offset++] = params.midtones.red;
    data[offset++] = params.midtones.green;
    data[offset++] = params.midtones.blue;
    data[offset++] = 0; // padding
    data[offset++] = 0; // padding

    // Highlights
    data[offset++] = params.highlights.brightness;
    data[offset++] = params.highlights.contrast;
    data[offset++] = params.highlights.saturation;
    data[offset++] = params.highlights.red;
    data[offset++] = params.highlights.green;
    data[offset++] = params.highlights.blue;
    data[offset++] = 0; // padding
    data[offset++] = 0; // padding

    // Ranges
    data[offset++] = params.shadowEnd;
    data[offset++] = params.highlightStart;
    data[offset++] = params.softness;
    data[offset++] = 0; // padding

    return data;
}

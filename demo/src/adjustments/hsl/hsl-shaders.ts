/**
 * HSL颜色调整WebGPU计算着色器
 * 基于参考实现的GPU加速版本
 */

// 从模块中导入所有必要的组件
import {
    hslComputeShaderTemplate,
    globalHSLComputeShaderTemplate,
    hexToHsl,
    createHSLParams,
    createGlobalHSLParams,
    type HSLAdjustmentParams,
    type GlobalHSLAdjustmentParams
} from './index';

/**
 * 标准HSL处理着色器（使用16x16工作组）
 * 适用于大多数WebGPU实现
 */
export const hslComputeShader = hslComputeShaderTemplate(16, 16);

/**
 * 高性能HSL处理着色器（使用32x32工作组）
 * 适用于支持更大工作组的现代GPU
 */
export const hslComputeShaderHighPerformance = hslComputeShaderTemplate(32, 32);

/**
 * 标准全局HSL处理着色器（使用16x16工作组）
 * 适用于大多数WebGPU实现
 */
export const globalHSLComputeShader = globalHSLComputeShaderTemplate(16, 16);

/**
 * 高性能全局HSL处理着色器（使用32x32工作组）
 * 适用于支持更大工作组的现代GPU
 */
export const globalHSLComputeShaderHighPerformance = globalHSLComputeShaderTemplate(32, 32);

/**
 * 创建HSL计算着色器模块
 * @param device WebGPU设备
 * @param highPerformance 是否使用高性能模式
 * @returns 着色器模块
 */
export function createHSLComputeShader(device: GPUDevice, highPerformance: boolean = false): GPUShaderModule {
    const shaderCode = highPerformance ? hslComputeShaderHighPerformance : hslComputeShader;
    return device.createShaderModule({
        code: shaderCode,
        label: highPerformance ? 'HSL Compute Shader (High Performance)' : 'HSL Compute Shader (Optimized)'
    });
}

/**
 * 创建全局HSL计算着色器模块（无遮罩）
 * @param device WebGPU设备
 * @param highPerformance 是否使用高性能模式
 * @returns 着色器模块
 */
export function createGlobalHSLComputeShader(device: GPUDevice, highPerformance: boolean = false): GPUShaderModule {
    const shaderCode = highPerformance ? globalHSLComputeShaderHighPerformance : globalHSLComputeShader;
    return device.createShaderModule({
        code: shaderCode,
        label: highPerformance ? 'Global HSL Compute Shader (High Performance)' : 'Global HSL Compute Shader (Optimized)'
    });
}

// 重新导出所有工具函数和类型以保持向后兼容性
export {
    hslComputeShaderTemplate,
    globalHSLComputeShaderTemplate,
    hexToHsl,
    createHSLParams,
    createGlobalHSLParams
};
export type { HSLAdjustmentParams, GlobalHSLAdjustmentParams };

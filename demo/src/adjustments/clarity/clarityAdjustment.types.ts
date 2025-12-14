/**
 * 清晰度调整相关类型定义
 */

/** 清晰度调整参数接口 */
export interface ClarityParams {
    /** 滤波强度 [1.0, 16.0] */
    sigma: number
    /** 正则化参数 [0.01, 0.1] */
    epsilon: number
    /** 窗口半径 [4, 32] */
    radius: number
    /** 线程组大小 [8, 32] */
    blockSize: number
    /** 细节强度 [0.1, 20.0] */
    detailStrength: number
    /** 增强强度 [0.1, 10.0] */
    enhancementStrength: number
    /** 宏观增强 [0.0, 2.0] */
    macroEnhancement: number
    /** 对比度增强 [1.0, 3.0] */
    contrastBoost: number
}

/** 清晰度预设配置项 */
export interface ClarityPresetConfig {
    /** 预设名称 */
    name: string
    /** 预设参数 */
    params: ClarityParams
}

/** 清晰度预设集合类型 */
export interface ClarityPresetsCollection {
    subtle: ClarityPresetConfig
    moderate: ClarityPresetConfig
    strong: ClarityPresetConfig
    aggressive: ClarityPresetConfig
}

/** GPU合成上下文 - 用于GPU合成操作的统一参数传递 */
export interface GPUCompositionContext {
    /** WebGPU设备 */
    device: GPUDevice
    /** 原始纹理 */
    originalTexture: GPUTexture
    /** 基础纹理（低频分量） */
    baseTexture: GPUTexture
    /** 细节纹理（高频分量） */
    detailTexture: GPUTexture
    /** 清晰度参数 */
    params: ClarityParams
    /** 图像宽度 */
    width: number
    /** 图像高度 */
    height: number
    // --- 以下为 BindGroup 创建阶段可选字段（通过收窄上下文提供） ---
    /** 输出纹理（BindGroup创建时必需） */
    outputTexture?: GPUTexture
    /** Uniform缓冲区（BindGroup创建时必需） */
    uniformBuffer?: GPUBuffer
    /** 计算管线（BindGroup创建时必需） */
    pipeline?: GPUComputePipeline
}

/** GPU纹理读取上下文 */
export interface GPUTextureReadContext {
    /** WebGPU设备 */
    device: GPUDevice
    /** 要读取的纹理 */
    texture: GPUTexture
    /** 图像宽度 */
    width: number
    /** 图像高度 */
    height: number
}

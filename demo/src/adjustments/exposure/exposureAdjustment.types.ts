/**
 * 曝光调整相关类型定义
 */

/** 曝光调整参数 */
export interface ExposureAdjustmentParams {
    strength: number
    targetExposure: number
    localAdjustFactor: number
}

/** 曝光直方图数据 */
export interface ExposureHistogramData {
    brightness: Uint32Array
    totalPixels: number
}

/**
 * @AITODO 上下文应该调整为所有GPU调整管线可以共享的类型
 * 尽可能覆盖各种调整操作所需要的数据的前提下,预留一个可以稍微灵活扩展的字段
 * 而不是在每一个调整模块单独定义上下文,以保证重构能够逐渐收敛为更统一和利于批处理的架构
 * 可以参考各种流程编排软件和管线处理的上下文结构
 * 曝光调整上下文 - 共享的GPU资源和参数
 * 遵循对象参数模式，避免多参数函数
 */
export interface ExposureContext {
    device: GPUDevice
    imageData?: ImageData
    width: number
    height: number
    // GPU 管线资源
    pipeline?: GPUComputePipeline
    bindGroupLayout?: GPUBindGroupLayout
    uniformBuffer?: GPUBuffer
    // GPU 纹理资源
    inputTexture?: GPUTexture
    outputTexture?: GPUTexture
    // GPU 缓冲区资源
    histogramBuffer?: GPUBuffer
    cdfBuffer?: GPUBuffer
}

/** 直方图特征分析结果 */
export interface HistogramFeatures {
    peakBin: number
    darkRatio: number
    brightRatio: number
}

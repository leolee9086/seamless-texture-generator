/**
 * 灰度蒙版合成器参数
 * 用于基于灰度蒙版将两个图片进行精细混合
 */
export interface GrayscaleCompositorParams {
    // 蒙版控制参数
    threshold: number;          // 蒙版阈值 0.0 - 1.0
    softness: number;           // 边缘柔和度 0.0 - 1.0
    contrast: number;           // 蒙版对比度 0.0 - 2.0
    invert: boolean;            // 是否反转蒙版

    // 混合控制参数
    blendMode: 'normal' | 'multiply' | 'screen' | 'overlay';
    opacity: number;            // 整体不透明度 0.0 - 1.0

    // 色彩调整参数
    maskBias: number;           // 蒙版偏移 -1.0 - 1.0
    maskGamma: number;          // 蒙版Gamma校正 0.1 - 3.0
}

/**
 * 灰度蒙版合成器函数参数
 */
export interface CompositeWithMaskParams {
    imageASource: string;
    imageBSource: string;
    maskSource: string;
    params: GrayscaleCompositorParams;
    outputWidth?: number;
    outputHeight?: number;
    wgslCode: string;
}

/**
 * 加载并调整图片尺寸的参数
 */
export interface LoadAndResizeImagesParams {
    imageASource: string;
    imageBSource: string;
    maskSource: string;
    width: number;
    height: number;
}

/**
 * 创建GPU纹理的参数
 */
export interface CreateTexturesParams {
    device: GPUDevice;
    bitmapA: ImageBitmap;
    bitmapB: ImageBitmap;
    bitmapMask: ImageBitmap;
    width: number;
    height: number;
}

/**
 * 执行计算着色器的参数
 */
export interface ExecuteComputeShaderParams {
    device: GPUDevice;
    pipeline: GPUComputePipeline;
    uniformBuffer: GPUBuffer;
    textureA: GPUTexture;
    textureB: GPUTexture;
    textureMask: GPUTexture;
    outputTexture: GPUTexture;
    width: number;
    height: number;
}

/**
 * 缓冲区转换为DataURL的参数
 */
export interface BufferToDataURLParams {
    readBuffer: GPUBuffer;
    width: number;
    height: number;
    bytesPerRow: number;
}

/**
 * 清理GPU资源的参数
 */
export interface CleanupGPUResourcesParams {
    textureA: GPUTexture;
    textureB: GPUTexture;
    textureMask: GPUTexture;
    outputTexture: GPUTexture;
    uniformBuffer: GPUBuffer;
    readBuffer: GPUBuffer;
}

/**
 * 创建计算管线的参数
 */
export interface CreateComputePipelineParams {
    device: GPUDevice;
    wgslCode: string;
}
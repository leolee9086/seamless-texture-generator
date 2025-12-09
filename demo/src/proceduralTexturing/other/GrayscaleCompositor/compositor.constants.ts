/**
 * 灰度蒙版合成器常量
 */

// 图片加载相关常量
export const IMAGE_CONSTANTS = {
    CROSS_ORIGIN: 'anonymous' as const,
    FAILED_TO_LOAD_IMAGE: 'Failed to load image' as const,
    WEBGPU_NOT_SUPPORTED: 'WebGPU不支持' as const
} as const;

// Canvas相关常量
export const CANVAS_CONSTANTS = {
    ELEMENT_TYPE: 'canvas' as const,
    CONTEXT_TYPE: '2d' as const,
    OUTPUT_FORMAT: 'image/png' as const
} as const;

// GPU纹理格式常量
export const GPU_CONSTANTS = {
    TEXTURE_FORMAT: 'rgba8unorm' as const
} as const;

// GPU绑定相关常量
export const GPU_BINDING_CONSTANTS = {
    BUFFER_TYPE_UNIFORM: 'uniform' as const,
    TEXTURE_SAMPLE_TYPE_FLOAT: 'float' as const,
    STORAGE_TEXTURE_ACCESS_WRITE_ONLY: 'write-only' as const,
    SHADER_STAGE_COMPUTE: 'compute' as const,
    SHADER_ENTRY_POINT: 'cs_main' as const
} as const;

// 混合模式映射
export const BLEND_MODE_MAP = {
    normal: 0.0,
    multiply: 1.0,
    screen: 2.0,
    overlay: 3.0
} as const;

// 工作组大小
export const WORKGROUP_SIZE = 8;
/**
 * 清晰度调整常量定义
 */

/** GPU资源标签 */
export const GPU资源标签 = {
    输入纹理: 'Clarity Input Texture',
    输出缓冲区: 'Clarity Output Buffer',
    合成结果: 'Composition Result',
    合成Uniform: 'Composition Uniforms',
    合成着色器: 'Composition Shader',
    合成管线: 'Composition Pipeline',
    合成编码器: 'Composition Encoder',
    合成Pass: 'Composition Pass'
} as const

/** 纹理格式 */
export const 纹理格式 = {
    RGBA32Float: 'rgba32float' as const
}

/** 管线配置 */
export const 管线配置 = {
    布局: 'auto' as const,
    入口点: 'main' as const
}

/** 工作组大小 */
export const 工作组大小 = 16

/** Uniform缓冲区大小（3个vec4，每个16字节） */
export const UNIFORM缓冲区大小 = 48

// 英文别名
export const GPU_RESOURCE_LABELS = GPU资源标签
export const TEXTURE_FORMATS = 纹理格式
export const PIPELINE_CONFIG = 管线配置
export const WORKGROUP_SIZE = 工作组大小
export const UNIFORM_BUFFER_SIZE = UNIFORM缓冲区大小

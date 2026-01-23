/**
 * 程序化纹理模式 - 常量定义
 */

/**
 * 文件名模板
 */
export const PROCEDURAL_TEXTURE_FILE_PREFIX = 'procedural-texture'
export const PROCEDURAL_TEXTURE_FILE_EXTENSION = '.png'

/**
 * 可作为输入源的模式列表
 */
export const CAN_BE_SOURCE_FOR_MODES = ['paint'] as const

/**
 * 日志消息
 */
export const LOG_MESSAGES = {
    ENTER_MODE: '[ProceduralMode] 进入程序化纹理模式',
    NO_TEXTURE_TO_PERSIST: '[ProceduralMode] 没有可持久化的纹理',
    TEXTURE_SAVED: '[ProceduralMode] 程序化纹理已保存为项目',
    UPDATE_TEXTURE_PLACEHOLDER: '[ProceduralMode] updateTexture 需要由外部提供生成器实现',
} as const

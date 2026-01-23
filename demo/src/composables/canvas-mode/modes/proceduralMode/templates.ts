/**
 * 程序化纹理模式 - 模板函数
 */

import { PROCEDURAL_TEXTURE_FILE_PREFIX, PROCEDURAL_TEXTURE_FILE_EXTENSION } from './constants'

/**
 * 生成程序化纹理文件名
 * @简洁函数 模板函数，仅用于生成文件名字符串
 */
export function generateProceduralTextureFileName(timestamp: number): string {
    return `${PROCEDURAL_TEXTURE_FILE_PREFIX}-${timestamp}${PROCEDURAL_TEXTURE_FILE_EXTENSION}`
}

/**
 * 下载相关的模板函数
 */

import { 扩展名_JPG, MIME类型前缀_IMAGE } from './download.constants'

/**
 * 生成带扩展名的文件名
 * @param fileName - 基础文件名
 * @returns 带 .jpg 扩展名的文件名
 */
export const 生成JPG文件名 = (fileName: string): string => `${fileName}${扩展名_JPG}`

/**
 * @简洁函数 模板生成工具函数
 * 生成带时间戳的下载文件名
 * @param fileName - 基础文件名
 * @param format - 文件格式
 * @returns 带时间戳和扩展名的文件名
 */
export const 生成带时间戳文件名 = (fileName: string, format: string): string =>
    `${fileName}-${Date.now()}.${format}`

/**
 * 根据格式生成 MIME 类型
 * @param format - 图像格式
 * @returns MIME 类型字符串
 */
export const 生成图像MIME类型 = (format: string): string => `${MIME类型前缀_IMAGE}${format}`

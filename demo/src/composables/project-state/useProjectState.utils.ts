/**
 * 项目状态管理工具函数
 *
 * 纯工具函数，无状态、无副作用
 */

import { 缩略图格式, 缩略图质量 } from './useProjectState.constants'
import { 创建Canvas上下文失败, 缩略图生成失败, 图片加载失败 } from './useProjectState.templates'

/**
 * 深度克隆对象，去除所有响应式代理和不可序列化内容 (POJO化)
 * 
 * 用于确保写入 IndexedDB 的数据是纯净的 JSON 对象，避免 DataCloneError
 * @param obj 任意对象
 */
export function cloneDeep<T>(obj: T): T {
    try {
        return JSON.parse(JSON.stringify(obj))
    } catch (error) {
        console.error('深度克隆失败:', error)
        // 回退到浅层克隆或直接返回 (虽然可能报错)
        return obj
    }
}

/**
 * 生成缩略图
 * @param file 原图文件或 Blob
 * @param maxSize 最大边长 (像素)
 * @returns 缩略图 Blob (WebP 格式)
 */
export async function 生成缩略图(file: File | Blob, maxSize: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        const url = URL.createObjectURL(file)

        img.onload = (): void => {
            URL.revokeObjectURL(url)

            const canvas = document.createElement('canvas')
            const scale = Math.min(maxSize / img.width, maxSize / img.height, 1)
            canvas.width = img.width * scale
            canvas.height = img.height * scale

            const ctx = canvas.getContext('2d')
            if (!ctx) {
                reject(new Error(创建Canvas上下文失败()))
                return
            }

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob)
                        return
                    }
                    reject(new Error(缩略图生成失败()))
                },
                缩略图格式,
                缩略图质量
            )
        }

        /** @简洁函数 图片加载失败的事件处理提前释放资源 */
        img.onerror = (): void => {
            URL.revokeObjectURL(url)
            reject(new Error(图片加载失败()))
        }

        img.src = url
    })
}

/**
 * 获取图片尺寸
 * @param file 图片文件或 Blob
 * @returns 宽度和高度
 */
export async function 获取图片尺寸(file: File | Blob): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        const url = URL.createObjectURL(file)

        /** @简洁函数 图片加载成功后返回尺寸并释放资源 */
        img.onload = (): void => {
            URL.revokeObjectURL(url)
            resolve({ width: img.width, height: img.height })
        }

        /** @简洁函数 图片加载失败的事件处理提前释放资源 */
        img.onerror = (): void => {
            URL.revokeObjectURL(url)
            reject(new Error(图片加载失败()))
        }

        img.src = url
    })
}

/**
 * Blob 转 DataURL
 * @param blob Blob 数据
 * @returns DataURL 字符串
 */
export async function blobToDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (): void => {
            const result = reader.result
            if (typeof result === 'string') {
                resolve(result)
                return
            }
            reject(new Error('无法转换 Blob 到 DataURL'))
        }
        reader.onerror = (): void => reject(reader.error)
        reader.readAsDataURL(blob)
    })
}

/**
 * DataURL 转 Blob
 * @param dataURL DataURL 字符串
 * @returns Blob 对象
 */
export function dataURLToBlob(dataURL: string): Blob {
    const arr = dataURL.split(',')
    const mime = arr[0].match(/:(.*?);/)?.[1] ?? ''
    const bstr = atob(arr[1])
    let charIndex = bstr.length
    const u8arr = new Uint8Array(charIndex)
    while (charIndex--) {
        u8arr[charIndex] = bstr.charCodeAt(charIndex)
    }
    return new Blob([u8arr], { type: mime })
}

/**
 * LUTPanel 工具函数
 * 从 LUTPanel.vue 提取的纯逻辑函数
 */

import { processImageToTileable } from '../../../processPipelines/imageProcessor'
import { lutDb, type LUTItem } from '../../../utils/lutDb'
import type { 缩略图创建参数 } from './LUTPanel.types'

// 重导出类型供外部使用
export type { 缩略图创建参数, MobileTab } from './LUTPanel.types'

// ==================== LUT 数据库操作 ====================

/**
 * 加载所有 LUT
 */
export async function 加载全部LUT(): Promise<LUTItem[]> {
    try {
        return await lutDb.getAllLUTs()
    } catch (error) {
        console.error('Failed to load LUTs:', error)
        return []
    }
}

/**
 * 删除指定 LUT
 */
export async function 删除LUT(id: string): Promise<boolean> {
    if (!confirm('Are you sure you want to delete this LUT?')) {
        return false
    }
    await lutDb.deleteLUT(id)
    return true
}

/**
 * 添加 LUT 文件到数据库
 */
export async function 添加LUT文件(file: File): Promise<LUTItem> {
    const lutItem: LUTItem = {
        id: crypto.randomUUID(),
        name: file.name,
        file: file,
        createdAt: Date.now()
    }
    await lutDb.addLUT(lutItem)
    return lutItem
}

// ==================== 缩略图处理 ====================

/**
 * 创建对比缩略图 (左半原图，右半处理后)
 */
export function 创建对比缩略图(参数: 缩略图创建参数): Promise<string> {
    const { 原图URL, 处理后URL, 宽度 = 32, 高度 = 32 } = 参数

    return new Promise((resolve, reject) => {
        const imgOriginal = new Image()
        const imgProcessed = new Image()
        imgOriginal.crossOrigin = 'Anonymous'
        imgProcessed.crossOrigin = 'Anonymous'

        let loadedCount = 0
        const checkLoaded = () => {
            loadedCount++
            if (loadedCount === 2) {
                draw()
            }
        }

        imgOriginal.onload = checkLoaded
        imgProcessed.onload = checkLoaded
        imgOriginal.onerror = (e) => reject(new Error('Failed to load original image: ' + e))
        imgProcessed.onerror = (e) => reject(new Error('Failed to load processed image: ' + e))

        imgOriginal.src = 原图URL
        imgProcessed.src = 处理后URL

        function draw() {
            const canvas = document.createElement('canvas')
            canvas.width = 宽度
            canvas.height = 高度
            const ctx = canvas.getContext('2d')
            if (!ctx) {
                reject(new Error('Failed to get canvas context'))
                return
            }

            ctx.imageSmoothingEnabled = true
            ctx.imageSmoothingQuality = 'high'

            const 半宽 = 宽度 / 2

            // 左半: 原图
            ctx.drawImage(imgOriginal,
                0, 0, imgOriginal.width / 2, imgOriginal.height,
                0, 0, 半宽, 高度
            )

            // 右半: 处理后
            ctx.drawImage(imgProcessed,
                imgProcessed.width / 2, 0, imgProcessed.width / 2, imgProcessed.height,
                半宽, 0, 半宽, 高度
            )

            resolve(canvas.toDataURL('image/png'))
        }
    })
}

/**
 * 更新单个 LUT 的缩略图
 */
export async function 更新LUT缩略图(
    lutId: string,
    原图URL: string,
    luts: LUTItem[]
): Promise<boolean> {
    const lut = luts.find(l => l.id === lutId)
    if (!lut) return false

    try {
        console.log('Updating thumbnail for LUT:', lut.name)

        // 创建 File 对象
        const lutFile = new File([lut.file], lut.name, { type: 'text/plain' })

        // 处理图像
        // 处理图像
        const processedUrl = await processImageToTileable({
            originalImage: 原图URL,
            maxResolution: 512,
            borderSize: 0,
            lutFile: lutFile,
            lutIntensity: 1.0
        })

        // 创建缩略图
        const thumbnail = await 创建对比缩略图({
            原图URL,
            处理后URL: processedUrl
        })

        // 保存缩略图
        await lutDb.updateLUTThumbnail(lutId, thumbnail)
        console.log('Thumbnail updated successfully for:', lut.name)
        return true
    } catch (error) {
        console.error('Failed to update thumbnail:', error)
        return false
    }
}

/**
 * 批量更新所有 LUT 缩略图
 */
export async function 批量更新缩略图(
    原图URL: string,
    luts: LUTItem[]
): Promise<void> {
    for (const lut of luts) {
        await 更新LUT缩略图(lut.id, 原图URL, luts)
    }
}

// ==================== Tab 切换逻辑 ====================

/**
 * 判断是否为图层 Tab
 */
export function 是图层Tab(tab: MobileTab): boolean {
    return tab !== 'lut' && tab !== 'add'
}

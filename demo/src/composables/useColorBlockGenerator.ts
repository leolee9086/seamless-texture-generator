import { Ref } from 'vue'
import { AdjustmentRangeMaskManager } from '../utils/lut/adjustmentRangeMask'
import { RGBColor } from '../utils/lut/colorQuantization'
import { HSLRange } from '../utils/lut/hslMask'
import { 从URL创建图片并等待加载完成, 获取ImageData } from '../utils/lut/image/load'

/**
 * 色块生成 composable
 */
export function useColorBlockGenerator(
    quantizedColorBlocks: Ref<RGBColor[]>,
    commonHslBlocks: Ref<HSLRange[]>,
    maskManager: Ref<AdjustmentRangeMaskManager | null>
) {
    /**
     * 生成色块
     */
    const generateColorBlocks = async (input: File | string): Promise<void> => {
        try {
            const url = input instanceof File ? URL.createObjectURL(input) : input
            const img = await 从URL创建图片并等待加载完成(url)
            const imageData = 获取ImageData(img)

            const maxDimension = 512
            const scale = Math.min(1, maxDimension / Math.max(img.width, img.height))

            if (scale < 1) {
                const scaledCanvas = document.createElement('canvas')
                const scaledCtx = scaledCanvas.getContext('2d')!
                const scaledWidth = Math.round(img.width * scale)
                const scaledHeight = Math.round(img.height * scale)
                scaledCanvas.width = scaledWidth
                scaledCanvas.height = scaledHeight
                scaledCtx.drawImage(img, 0, 0, scaledWidth, scaledHeight)
                const scaledImageData = scaledCtx.getImageData(0, 0, scaledWidth, scaledHeight)
                quantizedColorBlocks.value = AdjustmentRangeMaskManager.generateQuantizedColorBlocks(scaledImageData, 8)
            } else {
                quantizedColorBlocks.value = AdjustmentRangeMaskManager.generateQuantizedColorBlocks(imageData, 8)
            }

            commonHslBlocks.value = AdjustmentRangeMaskManager.generateCommonHslBlocks()
            maskManager.value = new AdjustmentRangeMaskManager()
        } catch (error) {
            console.error('生成色块失败:', error)
        }
    }

    return { generateColorBlocks }
}

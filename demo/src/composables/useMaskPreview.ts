import { Ref } from 'vue'
import { 从URL创建图片并等待加载完成 } from '../utils/lut/image/load'
import { 将ImageData绘制到Canvas } from '../utils/lut/canvas/draw'
import { 按照最大尺寸缩放现有画布 } from '../utils/lut/canvas/scale'
import { createMaskPreviewData } from '../utils/lut/imageProcessor'
import { AdjustmentLayer } from './useColorBlockSelector.types'

/**
 * 遮罩预览 composable
 */
export function useMaskPreview(
    layers: Ref<AdjustmentLayer[]>,
    maskPreviewCanvas: Ref<HTMLCanvasElement | null>,
    generateColorBlockMask: (originalImage: string) => Promise<Uint8Array | null>
) {
    /**
     * 更新蒙版预览
     */
    const updateMaskPreview = async (originalImage: string, canvas?: HTMLCanvasElement): Promise<void> => {
        const targetCanvas = canvas || maskPreviewCanvas.value
        if (!targetCanvas || !originalImage || layers.value.length === 0) {
            return
        }

        try {
            const fullSizeMask = await generateColorBlockMask(originalImage)
            if (!fullSizeMask) return

            const img = await 从URL创建图片并等待加载完成(originalImage)
            const ctx = targetCanvas.getContext('2d')
            if (!ctx) return

            const previewMaxSize = 200
            const { detail: { resultWidth: canvasWidth, resultHeight: canvasHeight } } =
                按照最大尺寸缩放现有画布(targetCanvas, previewMaxSize, previewMaxSize)

            ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight)

            const maskImageData = createMaskPreviewData(fullSizeMask, img, canvasWidth, canvasHeight)
            将ImageData绘制到Canvas(maskImageData, targetCanvas, 'source-over')
        } catch (error) {
            console.error('更新蒙版预览失败:', error)
        }
    }

    /**
     * 生成蒙版预览图像数据URL
     */
    const generateMaskPreviewImageDataUrl = async (originalImage: string): Promise<string | null> => {
        if (!originalImage || layers.value.length === 0) {
            return null
        }

        try {
            const fullSizeMask = await generateColorBlockMask(originalImage)
            if (!fullSizeMask) return null

            const img = await 从URL创建图片并等待加载完成(originalImage)
            const previewMaxSize = 400
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            if (!ctx) return null

            const scale = Math.min(1, previewMaxSize / Math.max(img.width, img.height))
            const canvasWidth = Math.round(img.width * scale)
            const canvasHeight = Math.round(img.height * scale)
            canvas.width = canvasWidth
            canvas.height = canvasHeight

            ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight)

            const maskImageData = createMaskPreviewData(fullSizeMask, img, canvasWidth, canvasHeight)
            ctx.putImageData(maskImageData, 0, 0)

            return canvas.toDataURL('image/png')
        } catch (error) {
            console.error('生成蒙版预览图像失败:', error)
            return null
        }
    }

    return {
        updateMaskPreview,
        generateMaskPreviewImageDataUrl
    }
}

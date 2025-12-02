import { ref, watch, nextTick } from 'vue'
import { AdjustmentRangeMaskManager } from '../utils/lut/adjustmentRangeMask'
import { RGBColor } from '../utils/lut/colorQuantization'
import { HSLRange } from '../utils/lut/hslMask'
import { 从URL创建图片并等待加载完成, 获取imgeData } from '../utils/lut/image/load'
import { upscaleMask } from '../utils/lut/scalar'
import { 生成全白RGBA图像数据 } from '../utils/lut/mask/filledMask'
import { 将ImageData绘制到Canvas } from '../utils/lut/canvas/draw'
import { 按照最大尺寸缩放现有画布 } from '../utils/lut/canvas/scale'
import { extractBlockId, collectSelectedColors, createMaskManagerOptions } from '../utils/lut/colorBlockSelector'
import { prepareImageData, createPreviewImageData, createMaskPreviewData } from '../utils/lut/imageProcessor'

/**
 * 色块选择相关的composable
 */
export const useColorBlockSelector = () => {
    // 色块选择相关状态
    const quantizedColorBlocks = ref<RGBColor[]>([])
    const commonHslBlocks = ref<HSLRange[]>([])
    const selectedColorBlocks = ref<string[]>([])
    const maskOptions = ref({
        smooth: true,
        invert: false
    })
    const maskManager = ref<AdjustmentRangeMaskManager | null>(null)
    const maskPreviewCanvas = ref<HTMLCanvasElement | null>(null)

    /**
     * 配置遮罩管理器
     */
    const configureMaskManager = (selectedColors: RGBColor[], selectedHslRanges: HSLRange[]) => {
        if (!maskManager.value) return

        const options = createMaskManagerOptions(selectedColors, selectedHslRanges, maskOptions.value)
        maskManager.value.updateOptions(options)
    }

    /**
     * 生成色块
     */
    const generateColorBlocks = async (input: File | string) => {
        try {
            let url: string
            if (input instanceof File) {
                url = URL.createObjectURL(input)
            } else {
                url = input
            }
            // 创建图像元素获取图像数据
            const img = await 从URL创建图片并等待加载完成(url)
            // 创建canvas获取ImageData
            const imageData = 获取imgeData(img)

            // 生成量化色块（降采样到合理大小）
            const maxDimension = 512
            const scale = Math.min(1, maxDimension / Math.max(img.width, img.height))
            const scaledWidth = Math.round(img.width * scale)
            const scaledHeight = Math.round(img.height * scale)

            if (scale < 1) {
                const scaledCanvas = document.createElement('canvas')
                const scaledCtx = scaledCanvas.getContext('2d')!
                scaledCanvas.width = scaledWidth
                scaledCanvas.height = scaledHeight
                scaledCtx.drawImage(img, 0, 0, scaledWidth, scaledHeight)
                const scaledImageData = scaledCtx.getImageData(0, 0, scaledWidth, scaledHeight)
                quantizedColorBlocks.value = AdjustmentRangeMaskManager.generateQuantizedColorBlocks(scaledImageData, 8)
            } else {
                quantizedColorBlocks.value = AdjustmentRangeMaskManager.generateQuantizedColorBlocks(imageData, 8)
            }

            // 生成常用HSL色块
            commonHslBlocks.value = AdjustmentRangeMaskManager.generateCommonHslBlocks()
            // 初始化遮罩管理器
            maskManager.value = new AdjustmentRangeMaskManager()
        } catch (error) {
            console.error('生成色块失败:', error)
        }
    }

    /**
     * 切换量化色块选择
     */
    const toggleColorBlock = (blockId: string, color: RGBColor) => {
        const index = selectedColorBlocks.value.indexOf(blockId)
        if (index > -1) {
            selectedColorBlocks.value.splice(index, 1)
        } else {
            selectedColorBlocks.value.push(blockId)
        }
    }

    /**
     * 切换HSL色块选择
     */
    const toggleHslBlock = (blockId: string, hslBlock: HSLRange) => {
        const index = selectedColorBlocks.value.indexOf(blockId)
        if (index > -1) {
            selectedColorBlocks.value.splice(index, 1)
        } else {
            selectedColorBlocks.value.push(blockId)
        }
    }

    /**
     * 生成色块遮罩
     */
    const generateColorBlockMask = async (originalImage: string): Promise<Uint8Array | null> => {
        if (!maskManager.value) {
            return null
        }

        // 获取图像尺寸
        const img = await 从URL创建图片并等待加载完成(originalImage)

        // 如果没有选择任何色块，生成全白遮罩（对整个图像应用LUT）
        if (selectedColorBlocks.value.length === 0) {
            return 生成全白RGBA图像数据(img.width, img.height)
        }

        try {
            // 准备图像数据
            const { imageData, scale } = await prepareImageData(img)

            // 收集选中的颜色
            const { selectedColors, selectedHslRanges } = collectSelectedColors(
                selectedColorBlocks.value,
                quantizedColorBlocks.value,
                commonHslBlocks.value
            )

            // 配置遮罩管理器
            configureMaskManager(selectedColors, selectedHslRanges)

            // 生成遮罩（使用降采样数据计算，但返回原图尺寸）
            const result = await maskManager.value.generateAdjustmentRangeMask(imageData)

            // 如果使用了降采样，需要将遮罩放大到原图尺寸
            let finalMask: Uint8Array
            if (scale < 1) {
                // 将降采样遮罩放大到原图尺寸
                finalMask = upscaleMask(result.mask, result.width, result.height, img.width, img.height)
            } else {
                finalMask = result.mask
            }

            // 直接返回单通道遮罩数据
            return finalMask
        } catch (error) {
            console.error('生成色块遮罩失败:', error)
            return null
        }
    }

    /**
     * 更新蒙版预览
     */
    const updateMaskPreview = async (originalImage: string, canvas?: HTMLCanvasElement) => {
        const targetCanvas = canvas || maskPreviewCanvas.value
        if (!targetCanvas || !originalImage || selectedColorBlocks.value.length === 0) {
            return
        }

        try {
            if (!maskManager.value) {
                return
            }

            // 创建预览图像数据
            const { img, imageData, scale } = await createPreviewImageData(originalImage)

            // 收集选中的颜色
            const { selectedColors, selectedHslRanges } = collectSelectedColors(
                selectedColorBlocks.value,
                quantizedColorBlocks.value,
                commonHslBlocks.value
            )

            // 配置遮罩管理器
            configureMaskManager(selectedColors, selectedHslRanges)

            // 生成遮罩
            const result = await maskManager.value.generateAdjustmentRangeMask(imageData)

            // 如果使用了降采样，需要将遮罩放大到原图尺寸
            let finalMask: Uint8Array
            if (scale < 1) {
                finalMask = upscaleMask(result.mask, result.width, result.height, img.width, img.height)
            } else {
                finalMask = result.mask
            }

            const ctx = targetCanvas.getContext('2d')
            if (!ctx) return

            const previewMaxSize = 200
            const { detail: { resultWidth: canvasWidth, resultHeight: canvasHeight } } = 按照最大尺寸缩放现有画布(targetCanvas, previewMaxSize, previewMaxSize)

            // 绘制原始图像（缩小）
            ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight)

            // 创建遮罩预览数据
            const maskImageData = createMaskPreviewData(finalMask, img, canvasWidth, canvasHeight)

            // 创建临时画布来绘制遮罩
            将ImageData绘制到Canvas(maskImageData, targetCanvas, 'source-over')
        } catch (error) {
            console.error('更新蒙版预览失败:', error)
        }
    }

    return {
        // 状态
        quantizedColorBlocks,
        commonHslBlocks,
        selectedColorBlocks,
        maskOptions,
        maskManager,
        maskPreviewCanvas,

        // 方法
        generateColorBlocks,
        toggleColorBlock,
        toggleHslBlock,
        generateColorBlockMask,
        updateMaskPreview
    }
}

import { ref } from 'vue'
import { AdjustmentRangeMaskManager } from '../utils/lut/adjustmentRangeMask'
import { RGBColor } from '../utils/lut/colorQuantization'
import { HSLRange } from '../utils/lut/hslMask'
import { 从URL创建图片并等待加载完成, 获取imgeData } from '../utils/lut/image/load'
import { upscaleMask } from '../utils/lut/scalar'
import { 生成全白RGBA图像数据 } from '../utils/lut/mask/filledMask'
import { 将ImageData绘制到Canvas } from '../utils/lut/canvas/draw'
import { 按照最大尺寸缩放现有画布 } from '../utils/lut/canvas/scale'
import { prepareImageData, createMaskPreviewData } from '../utils/lut/imageProcessor'

/**
 * 调整图层接口
 */
export interface AdjustmentLayer {
    id: string
    name: string
    type: 'quantized' | 'hsl'
    visible: boolean
    intensity: number
    blendMode: 'add' | 'multiply' | 'max' | 'min'
    // Quantized color specific
    color?: RGBColor
    tolerance?: number
    // HSL specific
    hslRange?: HSLRange
}

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

    // 图层系统
    const layers = ref<AdjustmentLayer[]>([])
    const activeLayerId = ref<string | null>(null)

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
     * 添加量化颜色图层
     */
    const addColorLayer = (color: RGBColor) => {
        const id = `quantized-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        layers.value.push({
            id,
            name: `Color RGB(${color.r},${color.g},${color.b})`,
            type: 'quantized',
            visible: true,
            intensity: 1.0,
            blendMode: 'max',
            color: { ...color },
            tolerance: 30
        })
        activeLayerId.value = id
    }

    /**
     * 添加HSL图层
     */
    const addHslLayer = (hslBlock: HSLRange) => {
        const id = `hsl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        layers.value.push({
            id,
            name: hslBlock.name || 'Custom HSL',
            type: 'hsl',
            visible: true,
            intensity: 1.0,
            blendMode: 'max',
            hslRange: { ...hslBlock }
        })
        activeLayerId.value = id
    }

    /**
     * 移除图层
     */
    const removeLayer = (id: string) => {
        const index = layers.value.findIndex(l => l.id === id)
        if (index > -1) {
            layers.value.splice(index, 1)
            if (activeLayerId.value === id) {
                activeLayerId.value = null
            }
        }
    }

    /**
     * 选择图层
     */
    const selectLayer = (id: string) => {
        activeLayerId.value = id
    }

    /**
     * 更新图层
     */
    const updateLayer = (id: string, updates: Partial<AdjustmentLayer>) => {
        const layer = layers.value.find(l => l.id === id)
        if (layer) {
            Object.assign(layer, updates)
        }
    }

    /**
     * 切换量化色块选择 (已废弃,保留用于兼容)
     */
    const toggleColorBlock = (_blockId: string, color: RGBColor) => {
        // 现在转换为添加图层
        addColorLayer(color)
    }

    /**
     * 切换HSL色块选择 (已废弃,保留用于兼容)
     */
    const toggleHslBlock = (_blockId: string, hslBlock: HSLRange) => {
        // 现在转换为添加图层
        addHslLayer(hslBlock)
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

        // 如果没有可见图层，生成全白遮罩（对整个图像应用LUT）
        const visibleLayers = layers.value.filter(l => l.visible)
        if (visibleLayers.length === 0) {
            return 生成全白RGBA图像数据(img.width, img.height)
        }

        try {
            // 准备图像数据
            const { imageData, scale } = await prepareImageData(img)

            // 为每个图层生成遮罩
            const layerMasks: Uint8Array[] = []

            for (const layer of visibleLayers) {
                let layerMask: Uint8Array | null = null

                if (layer.type === 'hsl' && layer.hslRange) {
                    // HSL Mask
                    maskManager.value.updateOptions({
                        useQuantization: false,
                        useHslMask: true,
                        hslRange: layer.hslRange,
                        maskOptions: maskOptions.value
                    })
                    const result = await maskManager.value.generateAdjustmentRangeMask(imageData)
                    layerMask = result.mask
                } else if (layer.type === 'quantized' && layer.color) {
                    // Quantized Color Mask
                    maskManager.value.updateOptions({
                        useQuantization: true,
                        useHslMask: false,
                        selectedColors: [layer.color],
                        colorTolerance: layer.tolerance || 30,
                        maskOptions: maskOptions.value
                    })
                    const result = await maskManager.value.generateAdjustmentRangeMask(imageData)
                    layerMask = result.mask
                }

                if (layerMask) {
                    // 应用图层强度
                    if (layer.intensity < 1.0) {
                        for (let i = 0; i < layerMask.length; i++) {
                            layerMask[i] = Math.round(layerMask[i] * layer.intensity)
                        }
                    }
                    layerMasks.push(layerMask)
                }
            }

            // 组合所有图层的遮罩
            let finalMask: Uint8Array
            if (layerMasks.length === 0) {
                finalMask = new Uint8Array(imageData.width * imageData.height)
            } else if (layerMasks.length === 1) {
                finalMask = layerMasks[0]
            } else {
                // 使用第一个图层作为基础
                finalMask = new Uint8Array(layerMasks[0])

                // 依次混合后续图层
                for (let i = 1; i < layerMasks.length; i++) {
                    const currentLayer = visibleLayers[i]
                    const currentMask = layerMasks[i]
                    const blendMode = currentLayer.blendMode || 'max'

                    for (let p = 0; p < finalMask.length; p++) {
                        const baseVal = finalMask[p]
                        const blendVal = currentMask[p]

                        if (blendMode === 'add') {
                            finalMask[p] = Math.min(255, baseVal + blendVal)
                        } else if (blendMode === 'multiply') {
                            finalMask[p] = Math.round((baseVal * blendVal) / 255)
                        } else if (blendMode === 'max') {
                            finalMask[p] = Math.max(baseVal, blendVal)
                        } else if (blendMode === 'min') {
                            finalMask[p] = Math.min(baseVal, blendVal)
                        }
                    }
                }
            }


            // 如果使用了降采样，需要将遮罩放大到原图尺寸
            if (scale < 1) {
                finalMask = upscaleMask(finalMask, imageData.width, imageData.height, img.width, img.height)
            }

            const rgbaMask = new Uint8Array(finalMask.length * 4)
            for (let i = 0; i < finalMask.length; i++) {
                const value =finalMask[i]
                rgbaMask[i * 4] = value     // R
                rgbaMask[i * 4 + 1] = value // G
                rgbaMask[i * 4 + 2] = value // B
                rgbaMask[i * 4 + 3] = 255   // A (不透明)
            }

            return rgbaMask
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
        if (!targetCanvas || !originalImage || layers.value.length === 0) {
            return
        }

        try {
            if (!maskManager.value) {
                return
            }

            // 直接重用generateColorBlockMask的逻辑来生成预览
            const fullSizeMask = await generateColorBlockMask(originalImage)
            if (!fullSizeMask) return

            const img = await 从URL创建图片并等待加载完成(originalImage)
            const ctx = targetCanvas.getContext('2d')
            if (!ctx) return

            const previewMaxSize = 200
            const { detail: { resultWidth: canvasWidth, resultHeight: canvasHeight } } = 按照最大尺寸缩放现有画布(targetCanvas, previewMaxSize, previewMaxSize)

            // 绘制原始图像（缩小）
            ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight)

            // 创建遮罩预览数据
            const maskImageData = createMaskPreviewData(fullSizeMask, img, canvasWidth, canvasHeight)

            // 创建临时画布来绘制遮罩
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
            if (!maskManager.value) {
                return null
            }

            const fullSizeMask = await generateColorBlockMask(originalImage)
            if (!fullSizeMask) return null

            const img = await 从URL创建图片并等待加载完成(originalImage)
            const previewMaxSize = 400 // 预览图像最大尺寸
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            if (!ctx) return null

            // 计算缩放尺寸
            const scale = Math.min(1, previewMaxSize / Math.max(img.width, img.height))
            const canvasWidth = Math.round(img.width * scale)
            const canvasHeight = Math.round(img.height * scale)
            canvas.width = canvasWidth
            canvas.height = canvasHeight

            // 绘制原始图像（缩小）
            ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight)

            // 创建遮罩预览数据
            const maskImageData = createMaskPreviewData(fullSizeMask, img, canvasWidth, canvasHeight)

            // 绘制遮罩
            ctx.putImageData(maskImageData, 0, 0)

            return canvas.toDataURL('image/png')
        } catch (error) {
            console.error('生成蒙版预览图像失败:', error)
            return null
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
        layers,
        activeLayerId,

        // 方法
        generateColorBlocks,
        addColorLayer,
        addHslLayer,
        removeLayer,
        selectLayer,
        updateLayer,
        toggleColorBlock,
        toggleHslBlock,
        generateColorBlockMask,
        updateMaskPreview,
        generateMaskPreviewImageDataUrl
    }
}

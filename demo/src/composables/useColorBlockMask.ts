import { Ref } from 'vue'
import { AdjustmentRangeMaskManager } from '../utils/lut/adjustmentRangeMask'
import { 从URL创建图片并等待加载完成 } from '../utils/lut/image/load'
import { upscaleMask } from '../utils/lut/scalar'
import { 生成全白RGBA图像数据 } from '../utils/lut/mask/filledMask'
import { prepareImageData } from '../utils/lut/imageProcessor'
import { AdjustmentLayer, MaskOptions } from './useColorBlockSelector.types'

/**
 * 遮罩生成 composable
 */
export function useColorBlockMask(
    layers: Ref<AdjustmentLayer[]>,
    maskManager: Ref<AdjustmentRangeMaskManager | null>,
    maskOptions: Ref<MaskOptions>
) {
    /**
     * 生成色块遮罩
     */
    const generateColorBlockMask = async (originalImage: string): Promise<Uint8Array | null> => {
        if (!maskManager.value) {
            return null
        }

        const img = await 从URL创建图片并等待加载完成(originalImage)

        const visibleLayers = layers.value.filter(l => l.visible)
        if (visibleLayers.length === 0) {
            return 生成全白RGBA图像数据(img.width, img.height)
        }

        try {
            const { imageData, scale } = await prepareImageData(img)
            const layerMasks: Uint8Array[] = []

            for (const layer of visibleLayers) {
                let layerMask: Uint8Array | null = null

                if (layer.type === 'hsl' && layer.hslRange) {
                    maskManager.value.updateOptions({
                        useQuantization: false,
                        useHslMask: true,
                        hslRange: layer.hslRange,
                        maskOptions: maskOptions.value
                    })
                    const result = await maskManager.value.generateAdjustmentRangeMask(imageData)
                    layerMask = result.mask
                } else if (layer.type === 'quantized' && layer.color) {
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
                    if (layer.intensity < 1.0) {
                        for (let i = 0; i < layerMask.length; i++) {
                            layerMask[i] = Math.round(layerMask[i] * layer.intensity)
                        }
                    }
                    layerMasks.push(layerMask)
                }
            }

            let finalMask = blendLayerMasks(layerMasks, visibleLayers, imageData.width * imageData.height)

            if (scale < 1) {
                finalMask = upscaleMask(finalMask, imageData.width, imageData.height, img.width, img.height)
            }

            return convertToRGBA(finalMask)
        } catch (error) {
            console.error('生成色块遮罩失败:', error)
            return null
        }
    }

    return { generateColorBlockMask }
}

/**
 * 混合多个图层遮罩
 */
function blendLayerMasks(
    layerMasks: Uint8Array[],
    visibleLayers: AdjustmentLayer[],
    size: number
): Uint8Array {
    if (layerMasks.length === 0) {
        return new Uint8Array(size)
    }
    if (layerMasks.length === 1) {
        return layerMasks[0]
    }

    const finalMask = new Uint8Array(layerMasks[0])

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

    return finalMask
}

/**
 * 将灰度遮罩转换为 RGBA 格式
 */
function convertToRGBA(mask: Uint8Array): Uint8Array {
    const rgbaMask = new Uint8Array(mask.length * 4)
    for (let i = 0; i < mask.length; i++) {
        const value = mask[i]
        rgbaMask[i * 4] = value     // R
        rgbaMask[i * 4 + 1] = value // G
        rgbaMask[i * 4 + 2] = value // B
        rgbaMask[i * 4 + 3] = 255   // A
    }
    return rgbaMask
}

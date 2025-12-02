import { RGBColor } from './colorQuantization'
import { HSLRange } from './hslMask'
import { 根据ID添加RGB颜色数据到选择组, 根据ID添加HSL色块数据到选择组 } from './colorBlocks'

/**
 * 从色块编号提取ID
 */
export const extractBlockId = (blockId: string): number => {
    return parseInt(blockId.split('-')[1])
}

/**
 * 收集选中的颜色数据
 */
export const collectSelectedColors = (
    selectedColorBlocks: string[],
    quantizedColorBlocks: RGBColor[],
    commonHslBlocks: HSLRange[]
) => {
    const selectedColors: RGBColor[] = []
    const selectedHslRanges: HSLRange[] = []

    for (const blockId of selectedColorBlocks) {
        if (blockId.startsWith('quantized-')) {
            const index = extractBlockId(blockId)
            if (quantizedColorBlocks[index]) {
                根据ID添加RGB颜色数据到选择组(index, quantizedColorBlocks, selectedColors)
            }
        } else if (blockId.startsWith('hsl-')) {
            const index = extractBlockId(blockId)
            if (commonHslBlocks[index]) {
                根据ID添加HSL色块数据到选择组(index, commonHslBlocks, selectedHslRanges)
            }
        }
    }

    return { selectedColors, selectedHslRanges }
}

/**
 * 配置遮罩管理器选项
 */
export const createMaskManagerOptions = (
    selectedColors: RGBColor[],
    selectedHslRanges: HSLRange[],
    maskOptions: { smooth: boolean; invert: boolean }
) => {
    const options = {
        useQuantization: selectedColors.length > 0,
        useHslMask: selectedHslRanges.length > 0,
        selectedColors,
        maskOptions
    }

    // 如果有HSL色块，使用第一个作为主要HSL范围
    if (selectedHslRanges.length > 0) {
        return {
            ...options,
            hslRange: selectedHslRanges[0]
        }
    }

    return options
}

import type { RGBColor } from './colorQuantization'
import type { HSLRange } from './hslMask'
export const 根据ID添加RGB颜色数据到选择组 = (id: number, source: RGBColor[], target: RGBColor[]) => {
    const colorBlock = source[id]
    if (colorBlock) {
        target.push({
            r: colorBlock.r,
            g: colorBlock.g,
            b: colorBlock.b,
            count: colorBlock.count
        })
    }
}
export const 根据ID添加HSL色块数据到选择组 = (id: number, source: HSLRange[], target: HSLRange[]) => {
    const hslBlock = source[id]
    if (hslBlock) {
        target.push({
            name: hslBlock.name,
            hue: hslBlock.hue,
            hueTolerance: hslBlock.hueTolerance,
            saturation: hslBlock.saturation,
            saturationTolerance: hslBlock.saturationTolerance,
            lightness: hslBlock.lightness,
            lightnessTolerance: hslBlock.lightnessTolerance,
            feather: hslBlock.feather
        })
    }
}

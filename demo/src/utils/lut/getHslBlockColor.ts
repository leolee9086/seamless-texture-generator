import type { HSLRange } from './hslMask'
// HSL转RGB的简单实现
export const hue2rgb = (p: number, q: number, t: number): number => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
}

// 获取HSL色块对应的RGB颜色
export const getHslBlockColor = (hslBlock: HSLRange): string => {
    // 使用HSL值转换为RGB颜色
    const h = hslBlock.hue / 360
    const s = hslBlock.saturation / 100
    const l = hslBlock.lightness / 100


    let r, g, b
    if (s === 0) {
        r = g = b = l // 灰度
    } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s
        const p = 2 * l - q
        r = hue2rgb(p, q, h + 1 / 3)
        g = hue2rgb(p, q, h)
        b = hue2rgb(p, q, h - 1 / 3)
    }
    const rgb = [
        Math.round(r * 255),
        Math.round(g * 255),
        Math.round(b * 255)
    ]
    return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`
}

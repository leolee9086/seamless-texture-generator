/**
 * HSL蒙版算法模块
 * 提供基于HSL色彩空间的智能蒙版生成功能
 */

import { RGBColor, HSLColor, rgbToHsl } from './colorQuantization';

/**
 * HSL范围参数
 */
export interface HSLRange {
    name?: string; // 色块名称
    hue: number; // 色相中心值 (0-360)
    hueTolerance: number; // 色相容差 (0-180)
    saturation: number; // 饱和度中心值 (0-100)
    saturationTolerance: number; // 饱和度容差 (0-100)
    lightness: number; // 明度中心值 (0-100)
    lightnessTolerance: number; // 明度容差 (0-100)
    feather: number; // 羽化程度 (0-1)
}

/**
 * 蒙版生成选项
 */
export interface MaskOptions {
    hslRange: HSLRange;
    blendMode?: 'add' | 'multiply' | 'max' | 'min';
    invert?: boolean;
    threshold?: number; // 阈值 (0-255)
    smooth?: boolean; // 是否平滑处理
    smoothRadius?: number; // 平滑半径
}

/**
 * 蒙版结果
 */
export interface MaskResult {
    mask: Uint8Array;
    width: number;
    height: number;
    statistics: {
        totalPixels: number;
        maskedPixels: number;
        maskRatio: number;
        averageIntensity: number;
    };
}

/**
 * HSL蒙版生成器
 */
export class HSLMaskGenerator {
    /**
     * 生成HSL蒙版
     */
    static generateMask(imageData: ImageData, options: MaskOptions): MaskResult {
        const { data, width, height } = imageData;
        const mask = new Uint8Array(width * height);

        // 生成基础蒙版
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            const hsl = rgbToHsl(r, g, b);
            const maskValue = this.computeHslDistance(hsl, options.hslRange);

            mask[i / 4] = Math.round(maskValue * 255);
        }

        // 应用阈值
        if (options.threshold !== undefined) {
            this.applyThreshold(mask, options.threshold);
        }

        // 平滑处理
        if (options.smooth) {
            this.smoothMask(mask, width, height, options.smoothRadius || 1);
        }

        // 反转蒙版
        if (options.invert) {
            this.invertMask(mask);
        }

        // 计算统计信息
        const statistics = this.computeMaskStatistics(mask);

        return {
            mask,
            width,
            height,
            statistics
        };
    }

    /**
     * 计算HSL距离
     */
    private static computeHslDistance(hsl: HSLColor, range: HSLRange): number {
        // 计算色相距离（考虑色相环的循环性）
        const hueDist = this.computeHueDistance(hsl.h, range.hue, range.hueTolerance);

        // 计算饱和度距离
        const satDist = Math.abs(hsl.s - range.saturation) / range.saturationTolerance;

        // 计算明度距离
        const lightDist = Math.abs(hsl.l - range.lightness) / range.lightnessTolerance;

        // 综合距离计算（使用欧几里得距离）
        const totalDist = Math.sqrt(hueDist * hueDist + satDist * satDist + lightDist * lightDist);

        // 应用羽化
        const maskValue = (1 - totalDist) * (1 - range.feather) +
            range.feather * Math.exp(-totalDist * 2);

        return Math.max(0, Math.min(1, maskValue));
    }

    /**
     * 计算色相距离（考虑色相环的循环性）
     */
    private static computeHueDistance(h1: number, h2: number, tolerance: number): number {
        // 处理色相环的循环性
        let diff = Math.abs(h1 - h2);
        diff = Math.min(diff, 360 - diff);

        // 归一化到0-1范围
        return Math.min(1, diff / tolerance);
    }

    /**
     * 应用阈值
     */
    private static applyThreshold(mask: Uint8Array, threshold: number): void {
        for (let i = 0; i < mask.length; i++) {
            mask[i] = mask[i] > threshold ? 255 : 0;
        }
    }

    /**
     * 平滑蒙版
     */
    private static smoothMask(mask: Uint8Array, width: number, height: number, radius: number): void {
        const smoothed = new Uint8Array(mask.length);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let sum = 0;
                let count = 0;

                // 计算周围像素的平均值
                for (let dy = -radius; dy <= radius; dy++) {
                    for (let dx = -radius; dx <= radius; dx++) {
                        const nx = x + dx;
                        const ny = y + dy;

                        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                            sum += mask[ny * width + nx];
                            count++;
                        }
                    }
                }

                smoothed[y * width + x] = Math.round(sum / count);
            }
        }

        // 复制回原数组
        mask.set(smoothed);
    }

    /**
     * 反转蒙版
     */
    private static invertMask(mask: Uint8Array): void {
        for (let i = 0; i < mask.length; i++) {
            mask[i] = 255 - mask[i];
        }
    }

    /**
     * 计算蒙版统计信息
     */
    private static computeMaskStatistics(mask: Uint8Array): MaskResult['statistics'] {
        const totalPixels = mask.length;
        let maskedPixels = 0;
        let totalIntensity = 0;

        for (let i = 0; i < mask.length; i++) {
            if (mask[i] > 0) {
                maskedPixels++;
            }
            totalIntensity += mask[i];
        }

        return {
            totalPixels,
            maskedPixels,
            maskRatio: maskedPixels / totalPixels,
            averageIntensity: totalIntensity / totalPixels
        };
    }

    /**
     * 组合多个蒙版
     */
    static combineMasks(masks: Uint8Array[], width: number, height: number, blendMode: 'add' | 'multiply' | 'max' | 'min' = 'max'): Uint8Array {
        if (masks.length === 0) {
            return new Uint8Array(width * height);
        }

        if (masks.length === 1) {
            return new Uint8Array(masks[0]);
        }

        const combined = new Uint8Array(width * height);

        for (let i = 0; i < combined.length; i++) {
            let value = masks[0][i];

            for (let j = 1; j < masks.length; j++) {
                switch (blendMode) {
                    case 'add':
                        value = Math.min(255, value + masks[j][i]);
                        break;
                    case 'multiply':
                        value = Math.round((value * masks[j][i]) / 255);
                        break;
                    case 'max':
                        value = Math.max(value, masks[j][i]);
                        break;
                    case 'min':
                        value = Math.min(value, masks[j][i]);
                        break;
                }
            }

            combined[i] = value;
        }

        return combined;
    }

    /**
     * 自适应HSL范围选择
     */
    static autoSelectHslRange(imageData: ImageData, x: number, y: number, radius: number = 10): HSLRange {
        const { data, width, height } = imageData;
        const surroundingColors: HSLColor[] = [];

        // 收集周围区域的颜色
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const nx = x + dx;
                const ny = y + dy;

                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    const index = (ny * width + nx) * 4;
                    const r = data[index];
                    const g = data[index + 1];
                    const b = data[index + 2];

                    surroundingColors.push(rgbToHsl(r, g, b));
                }
            }
        }

        // 计算中心颜色
        const centerIndex = (y * width + x) * 4;
        const centerR = data[centerIndex];
        const centerG = data[centerIndex + 1];
        const centerB = data[centerIndex + 2];
        const centerHsl = rgbToHsl(centerR, centerG, centerB);

        // 计算自适应容差
        const hueTolerance = this.computeAdaptiveTolerance(surroundingColors, 'hue');
        const saturationTolerance = this.computeAdaptiveTolerance(surroundingColors, 'saturation');
        const lightnessTolerance = this.computeAdaptiveTolerance(surroundingColors, 'lightness');

        return {
            hue: centerHsl.h,
            hueTolerance: Math.max(5, Math.min(90, hueTolerance)),
            saturation: centerHsl.s,
            saturationTolerance: Math.max(5, Math.min(50, saturationTolerance)),
            lightness: centerHsl.l,
            lightnessTolerance: Math.max(5, Math.min(50, lightnessTolerance)),
            feather: 0.3
        };
    }

    /**
     * 计算自适应容差
     */
    private static computeAdaptiveTolerance(colors: HSLColor[], channel: 'hue' | 'saturation' | 'lightness'): number {
        if (colors.length === 0) return 20;

        const values = colors.map(c => c[channel as keyof HSLColor]);
        const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
        const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);

        // 根据标准差计算容差，但设置合理的上下限
        const tolerance = stdDev * 2;

        switch (channel) {
            case 'hue':
                return Math.max(5, Math.min(90, tolerance));
            case 'saturation':
            case 'lightness':
                return Math.max(5, Math.min(50, tolerance));
            default:
                return 20;
        }
    }

    /**
     * 从量化结果生成蒙版
     */
    static generateMaskFromQuantization(
        imageData: ImageData,
        quantizedColors: RGBColor[],
        targetColors: RGBColor[],
        options: Partial<MaskOptions> = {}
    ): MaskResult {
        const { data, width, height } = imageData;
        const mask = new Uint8Array(width * height);

        // 创建目标颜色映射
        const _targetColorSet = new Set(targetColors.map(c => `${c.r},${c.g},${c.b}`));

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // 找到最接近的目标颜色
            const pixelColor = { r, g, b, count: 0 };
            let minDistance = Infinity;

            // 计算与所有目标颜色的最小距离
            for (const targetColor of targetColors) {
                const distance = this.colorDistance(pixelColor, targetColor);
                minDistance = Math.min(minDistance, distance);
            }

            // 使用距离的平方根作为蒙版值（距离越近，值越大）
            const tolerance = 100; // 颜色距离容差
            const maskValue = Math.max(0, Math.min(255, Math.round(255 * (1 - Math.sqrt(minDistance) / tolerance))));

            // 计算正确的蒙版索引
            const x = (i / 4) % width;
            const y = Math.floor((i / 4) / width);
            const maskIndex = y * width + x;
            mask[maskIndex] = maskValue;
        }

        // 应用选项
        if (options.smooth) {
            this.smoothMask(mask, width, height, options.smoothRadius || 1);
        }

        if (options.invert) {
            this.invertMask(mask);
        }

        const statistics = this.computeMaskStatistics(mask);

        return {
            mask,
            width,
            height,
            statistics
        };
    }

    /**
     * 找到最接近的颜色
     */
    private static findClosestColor(target: RGBColor, palette: RGBColor[]): RGBColor {
        let closest = palette[0];
        let minDistance = this.colorDistance(target, closest);

        for (const color of palette) {
            const distance = this.colorDistance(target, color);
            if (distance < minDistance) {
                minDistance = distance;
                closest = color;
            }
        }

        return closest;
    }

    /**
     * 计算颜色距离
     */
    private static colorDistance(color1: RGBColor, color2: RGBColor): number {
        const dr = color1.r - color2.r;
        const dg = color1.g - color2.g;
        const db = color1.b - color2.b;
        return dr * dr + dg * dg + db * db;
    }
}

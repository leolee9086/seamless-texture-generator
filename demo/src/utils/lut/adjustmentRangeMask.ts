/**
 * 调整范围遮罩管理器
 * 结合颜色量化和HSL蒙版算法，提供智能的调整范围遮罩生成功能
 */

import {
    OctreeQuantizer,
    MedianCutQuantizer,
    RGBColor,
    QuantizationResult
} from './colorQuantization';
import {
    HSLMaskGenerator,
    HSLRange,
    MaskOptions,
    MaskResult
} from './hslMask';

/**
 * 量化算法类型
 */
export type QuantizationAlgorithm = 'octree' | 'median-cut';

/**
 * 调整范围遮罩选项
 */
export interface AdjustmentRangeOptions {
    // 量化选项
    quantizationAlgorithm: QuantizationAlgorithm;
    maxColors: number;

    // HSL蒙版选项
    hslRange: HSLRange;
    maskOptions: Partial<MaskOptions>;

    // 组合选项
    useQuantization: boolean;
    useHslMask: boolean;
    blendMode: 'add' | 'multiply' | 'max' | 'min';

    // 高级选项
    autoSelectColors: boolean;
    selectedColors: RGBColor[];
    colorTolerance: number;
}

/**
 * 调整范围遮罩结果
 */
export interface AdjustmentRangeResult {
    mask: Uint8Array;
    width: number;
    height: number;
    quantizationResult?: QuantizationResult;
    hslMaskResult?: MaskResult;
    statistics: {
        totalPixels: number;
        maskedPixels: number;
        maskRatio: number;
        averageIntensity: number;
        selectedColors: RGBColor[];
    };
}

/**
 * 调整范围遮罩管理器
 */
export class AdjustmentRangeMaskManager {
    private options: AdjustmentRangeOptions;

    constructor(options: Partial<AdjustmentRangeOptions> = {}) {
        this.options = {
            quantizationAlgorithm: 'octree',
            maxColors: 64,
            hslRange: {
                hue: 0,
                hueTolerance: 30,
                saturation: 50,
                saturationTolerance: 30,
                lightness: 50,
                lightnessTolerance: 30,
                feather: 0.3
            },
            maskOptions: {
                smooth: true,
                smoothRadius: 1,
                threshold: undefined,
                invert: false
            },
            useQuantization: true,
            useHslMask: true,
            blendMode: 'max',
            autoSelectColors: false,
            selectedColors: [],
            colorTolerance: 30,
            ...options
        };
    }

    /**
     * 生成调整范围遮罩
     */
    async generateAdjustmentRangeMask(imageData: ImageData): Promise<AdjustmentRangeResult> {
        const masks: Uint8Array[] = [];
        let quantizationResult: QuantizationResult | undefined;
        let hslMaskResult: MaskResult | undefined;

        // 1. 颜色量化
        if (this.options.useQuantization) {
            quantizationResult = await this.performQuantization(imageData);

            if (this.options.autoSelectColors) {
                this.options.selectedColors = this.autoSelectColors(quantizationResult.palette);
            }

            if (this.options.selectedColors.length > 0) {
                const quantizedMask = HSLMaskGenerator.generateMaskFromQuantization(
                    imageData,
                    quantizationResult.palette,
                    this.options.selectedColors,
                    this.options.maskOptions
                );
                masks.push(quantizedMask.mask);
            }
        }

        // 2. HSL蒙版
        if (this.options.useHslMask) {
            hslMaskResult = HSLMaskGenerator.generateMask(imageData, {
                hslRange: this.options.hslRange,
                ...this.options.maskOptions
            });
            masks.push(hslMaskResult.mask);
        }

        // 3. 组合蒙版
        let finalMask: Uint8Array;
        if (masks.length === 0) {
            // 如果没有生成任何蒙版，返回全黑蒙版
            finalMask = new Uint8Array(imageData.width * imageData.height);
        } else if (masks.length === 1) {
            finalMask = new Uint8Array(masks[0]);
        } else {
            finalMask = HSLMaskGenerator.combineMasks(
                masks,
                imageData.width,
                imageData.height,
                this.options.blendMode
            );
        }

        // 4. 计算统计信息
        const statistics = this.computeFinalStatistics(finalMask, this.options.selectedColors);

        return {
            mask: finalMask,
            width: imageData.width,
            height: imageData.height,
            quantizationResult,
            hslMaskResult,
            statistics
        };
    }

    /**
     * 执行颜色量化
     */
    private async performQuantization(imageData: ImageData): Promise<QuantizationResult> {
        let quantizer: OctreeQuantizer | MedianCutQuantizer;

        switch (this.options.quantizationAlgorithm) {
            case 'octree':
                quantizer = new OctreeQuantizer(this.options.maxColors);
                break;
            case 'median-cut':
                quantizer = new MedianCutQuantizer(this.options.maxColors);
                break;
            default:
                quantizer = new OctreeQuantizer(this.options.maxColors);
        }

        return quantizer.quantize(imageData);
    }

    /**
     * 自动选择颜色
     */
    private autoSelectColors(palette: RGBColor[]): RGBColor[] {
        if (palette.length === 0) return [];

        // 按出现频率排序
        const sortedPalette = [...palette].sort((a, b) => b.count - a.count);

        // 选择前20%的颜色，但至少选择3个，最多选择10个
        const selectCount = Math.max(3, Math.min(10, Math.ceil(palette.length * 0.2)));

        return sortedPalette.slice(0, selectCount);
    }

    /**
     * 计算最终统计信息
     */
    private computeFinalStatistics(mask: Uint8Array, selectedColors: RGBColor[]): AdjustmentRangeResult['statistics'] {
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
            averageIntensity: totalIntensity / totalPixels,
            selectedColors: [...selectedColors]
        };
    }

    /**
     * 更新选项
     */
    updateOptions(newOptions: Partial<AdjustmentRangeOptions>): void {
        this.options = { ...this.options, ...newOptions };
    }

    /**
     * 获取当前选项
     */
    getOptions(): AdjustmentRangeOptions {
        return { ...this.options };
    }

    /**
     * 从图像点击位置自动生成HSL范围
     */
    autoGenerateHslRange(imageData: ImageData, x: number, y: number, radius: number = 10): void {
        const hslRange = HSLMaskGenerator.autoSelectHslRange(imageData, x, y, radius);
        this.options.hslRange = hslRange;
    }

    /**
     * 从图像点击位置自动选择颜色
     */
    autoSelectColorsFromClick(imageData: ImageData, x: number, y: number, tolerance: number = 30): void {
        const { data, width, height } = imageData;
        const index = (y * width + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];

        const targetColor: RGBColor = { r, g, b, count: 0 };

        // 执行量化
        this.performQuantization(imageData).then(result => {
            // 找到相似的颜色
            const similarColors = result.palette.filter(color =>
                this.colorDistance(targetColor, color) <= tolerance * tolerance
            );

            this.options.selectedColors = similarColors;
        });
    }

    /**
     * 计算颜色距离
     */
    private colorDistance(color1: RGBColor, color2: RGBColor): number {
        const dr = color1.r - color2.r;
        const dg = color1.g - color2.g;
        const db = color1.b - color2.b;
        return dr * dr + dg * dg + db * db;
    }

    /**
     * 导出蒙版为ImageData
     */
    exportMaskAsImageData(mask: Uint8Array, width: number, height: number): ImageData {
        const imageData = new ImageData(width, height);

        for (let i = 0; i < mask.length; i++) {
            const value = mask[i];
            const pixelIndex = i * 4;
            imageData.data[pixelIndex] = value;     // R
            imageData.data[pixelIndex + 1] = value; // G
            imageData.data[pixelIndex + 2] = value; // B
            imageData.data[pixelIndex + 3] = 255;   // A
        }

        return imageData;
    }

    /**
     * 应用蒙版到图像
     */
    applyMaskToImage(imageData: ImageData, mask: Uint8Array, intensity: number = 1.0): ImageData {
        const result = new ImageData(imageData.width, imageData.height);

        for (let i = 0; i < imageData.data.length; i += 4) {
            const maskIndex = i / 4;
            const maskValue = mask[maskIndex] / 255;
            const adjustedIntensity = maskValue * intensity;

            result.data[i] = imageData.data[i];     // R
            result.data[i + 1] = imageData.data[i + 1]; // G
            result.data[i + 2] = imageData.data[i + 2]; // B
            result.data[i + 3] = Math.round(imageData.data[i + 3] * adjustedIntensity); // A
        }

        return result;
    }

    /**
     * 生成8个量化色块
     */
    static generateQuantizedColorBlocks(imageData: ImageData, maxColors: number = 8): RGBColor[] {
        const quantizer = new OctreeQuantizer(maxColors);
        const result = quantizer.quantize(imageData);
        return result.palette;
    }

    /**
     * 生成常用HSL色块
     */
    static generateCommonHslBlocks(): HSLRange[] {
        return [
            // 肤色
            {
                name: '肤色',
                hue: 30,
                hueTolerance: 20,
                saturation: 40,
                saturationTolerance: 30,
                lightness: 60,
                lightnessTolerance: 25,
                feather: 0.1
            },
            // 天空蓝
            {
                name: '天空蓝',
                hue: 210,
                hueTolerance: 30,
                saturation: 60,
                saturationTolerance: 40,
                lightness: 70,
                lightnessTolerance: 30,
                feather: 0.1
            },
            // 绿色植被
            {
                name: '绿色植被',
                hue: 120,
                hueTolerance: 40,
                saturation: 50,
                saturationTolerance: 35,
                lightness: 45,
                lightnessTolerance: 35,
                feather: 0.1
            },
            // 红色
            {
                name: '红色',
                hue: 0,
                hueTolerance: 15,
                saturation: 70,
                saturationTolerance: 30,
                lightness: 50,
                lightnessTolerance: 30,
                feather: 0.1
            },
            // 黄色
            {
                name: '黄色',
                hue: 60,
                hueTolerance: 20,
                saturation: 80,
                saturationTolerance: 20,
                lightness: 60,
                lightnessTolerance: 25,
                feather: 0.1
            },
            // 紫色
            {
                name: '紫色',
                hue: 270,
                hueTolerance: 25,
                saturation: 50,
                saturationTolerance: 35,
                lightness: 45,
                lightnessTolerance: 30,
                feather: 0.3
            },
            // 高光
            {
                name: '高光',
                hue: 0,
                hueTolerance: 360, // 全色相
                saturation: 0,
                saturationTolerance: 100, // 全饱和度
                lightness: 80,
                lightnessTolerance: 20,
                feather: 0.2
            },
            // 阴影
            {
                name: '阴影',
                hue: 0,
                hueTolerance: 360, // 全色相
                saturation: 0,
                saturationTolerance: 100, // 全饱和度
                lightness: 30,
                lightnessTolerance: 20,
                feather: 0.2
            }
        ];
    }

    /**
     * 创建预设配置
     */
    static createPreset(presetName: string): Partial<AdjustmentRangeOptions> {
        switch (presetName) {
            case 'skin-tone':
                return {
                    hslRange: {
                        hue: 30,
                        hueTolerance: 20,
                        saturation: 40,
                        saturationTolerance: 30,
                        lightness: 60,
                        lightnessTolerance: 25,
                        feather: 0.4
                    },
                    useQuantization: true,
                    useHslMask: true,
                    blendMode: 'max'
                };

            case 'sky-blue':
                return {
                    hslRange: {
                        hue: 210,
                        hueTolerance: 30,
                        saturation: 60,
                        saturationTolerance: 40,
                        lightness: 70,
                        lightnessTolerance: 30,
                        feather: 0.3
                    },
                    useQuantization: true,
                    useHslMask: true,
                    blendMode: 'max'
                };

            case 'greens':
                return {
                    hslRange: {
                        hue: 120,
                        hueTolerance: 40,
                        saturation: 50,
                        saturationTolerance: 35,
                        lightness: 45,
                        lightnessTolerance: 35,
                        feather: 0.3
                    },
                    useQuantization: true,
                    useHslMask: true,
                    blendMode: 'max'
                };

            case 'highlights':
                return {
                    hslRange: {
                        hue: 0,
                        hueTolerance: 360, // 全色相
                        saturation: 0,
                        saturationTolerance: 100, // 全饱和度
                        lightness: 80,
                        lightnessTolerance: 20,
                        feather: 0.2
                    },
                    useQuantization: false,
                    useHslMask: true,
                    blendMode: 'max'
                };

            case 'shadows':
                return {
                    hslRange: {
                        hue: 0,
                        hueTolerance: 360, // 全色相
                        saturation: 0,
                        saturationTolerance: 100, // 全饱和度
                        lightness: 30,
                        lightnessTolerance: 20,
                        feather: 0.2
                    },
                    useQuantization: false,
                    useHslMask: true,
                    blendMode: 'max'
                };

            default:
                return {};
        }
    }
}

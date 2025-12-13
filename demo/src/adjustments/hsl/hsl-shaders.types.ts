/**
 * HSL调整参数接口
 */
export interface HSLAdjustmentParams {
    targetColor: string;    // 目标颜色（十六进制）
    hueOffset: number;      // 色相偏移（度）
    saturationOffset: number; // 饱和度偏移（百分比）
    lightnessOffset: number;  // 明度偏移（百分比）
    precision: number;       // 精确度（0-100）
    range: number;          // 羽化范围（0-100）
    maskMode: 'adjust' | 'mask' | 'overlay' | 'none'; // 遮罩模式
    overlayColor?: [number, number, number]; // 叠加颜色（RGB）
    overlayAlpha?: number;  // 叠加透明度
}

/**
 * 全局HSL调整参数接口
 */
export interface GlobalHSLAdjustmentParams {
    hueOffset: number;      // 色相偏移（度）
    saturationOffset: number; // 饱和度偏移（百分比）
    lightnessOffset: number;  // 明度偏移（百分比）
}
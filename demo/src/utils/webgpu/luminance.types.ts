/**
 * 亮度调整相关的类型定义
 */

// 区域调整参数
export interface ZoneAdjustment {
    brightness: number; // -1.0 to 1.0
    contrast: number;   // -1.0 to 1.0 (mapped to factor)
    saturation: number; // -1.0 to 1.0 (mapped to factor)
    red: number;        // -1.0 to 1.0
    green: number;      // -1.0 to 1.0
    blue: number;       // -1.0 to 1.0
}

// 亮度调整参数
export interface LuminanceAdjustmentParams {
    shadows: ZoneAdjustment;
    midtones: ZoneAdjustment;
    highlights: ZoneAdjustment;
    shadowEnd: number;      // 0.0 to 1.0, default 0.33
    highlightStart: number; // 0.0 to 1.0, default 0.66
    softness: number;       // 0.0 to 1.0, default 0.1
}

/** processLuminanceAdjustment 的参数类型 */
export interface ProcessLuminanceOptions {
    device: GPUDevice;
    inputTexture: GPUTexture;
    outputTexture: GPUTexture;
    params: LuminanceAdjustmentParams;
}
/**
 * Luminance Adjustment Presets
 * 亮度调整预设配置
 */

import type { LuminanceAdjustmentParams } from './imports';
import type { LuminancePreset, LuminancePresets } from './luminanceAdjustment.types';

// Default parameters for luminance adjustment
export const DEFAULT_LUMINANCE_PARAMS: LuminanceAdjustmentParams = {
    shadows: {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        red: 0,
        green: 0,
        blue: 0
    },
    midtones: {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        red: 0,
        green: 0,
        blue: 0
    },
    highlights: {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        red: 0,
        green: 0,
        blue: 0
    },
    shadowEnd: 0.33,
    highlightStart: 0.66,
    softness: 0.1
};

// Presets for common adjustments
export const LUMINANCE_PRESETS: LuminancePresets = {
    default: {
        name: '默认',
        params: { ...DEFAULT_LUMINANCE_PARAMS }
    },
    enhanceShadows: {
        name: '增强阴影',
        params: {
            ...DEFAULT_LUMINANCE_PARAMS,
            shadows: {
                brightness: 0.2,
                contrast: 0.1,
                saturation: 0.1,
                red: 0,
                green: 0,
                blue: 0
            }
        }
    },
    enhanceHighlights: {
        name: '增强高光',
        params: {
            ...DEFAULT_LUMINANCE_PARAMS,
            highlights: {
                brightness: -0.1,
                contrast: 0.1,
                saturation: 0.05,
                red: 0,
                green: 0,
                blue: 0
            }
        }
    },
    popColors: {
        name: '色彩鲜艳',
        params: {
            ...DEFAULT_LUMINANCE_PARAMS,
            shadows: {
                brightness: 0.1,
                contrast: 0,
                saturation: 0.2,
                red: 0,
                green: 0,
                blue: 0
            },
            midtones: {
                brightness: 0,
                contrast: 0.1,
                saturation: 0.3,
                red: 0,
                green: 0,
                blue: 0
            },
            highlights: {
                brightness: 0,
                contrast: 0,
                saturation: 0.1,
                red: 0,
                green: 0,
                blue: 0
            }
        }
    },
    contrastBoost: {
        name: '对比度增强',
        params: {
            ...DEFAULT_LUMINANCE_PARAMS,
            shadows: {
                brightness: -0.05,
                contrast: 0.2,
                saturation: 0,
                red: 0,
                green: 0,
                blue: 0
            },
            midtones: {
                brightness: 0,
                contrast: 0.3,
                saturation: 0,
                red: 0,
                green: 0,
                blue: 0
            },
            highlights: {
                brightness: 0.05,
                contrast: 0.2,
                saturation: 0,
                red: 0,
                green: 0,
                blue: 0
            }
        }
    },
    warmTones: {
        name: '暖色调',
        params: {
            ...DEFAULT_LUMINANCE_PARAMS,
            shadows: {
                brightness: 0,
                contrast: 0,
                saturation: 0.1,
                red: 0.05,
                green: 0.02,
                blue: -0.05
            },
            midtones: {
                brightness: 0,
                contrast: 0,
                saturation: 0.1,
                red: 0.08,
                green: 0.03,
                blue: -0.08
            },
            highlights: {
                brightness: 0,
                contrast: 0,
                saturation: 0.05,
                red: 0.05,
                green: 0,
                blue: -0.05
            }
        }
    },
    coolTones: {
        name: '冷色调',
        params: {
            ...DEFAULT_LUMINANCE_PARAMS,
            shadows: {
                brightness: 0,
                contrast: 0,
                saturation: 0.1,
                red: -0.05,
                green: 0,
                blue: 0.05
            },
            midtones: {
                brightness: 0,
                contrast: 0,
                saturation: 0.1,
                red: -0.08,
                green: 0,
                blue: 0.08
            },
            highlights: {
                brightness: 0,
                contrast: 0,
                saturation: 0.05,
                red: -0.05,
                green: 0,
                blue: 0.05
            }
        }
    }
};

// Get preset by key
export function getLuminancePreset(preset: LuminancePreset): LuminanceAdjustmentParams {
    return LUMINANCE_PRESETS[preset].params;
}

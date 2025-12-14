/**
 * 亮度调整预设相关的类型定义
 */

import type { LuminanceAdjustmentParams } from './imports';

// 亮度调整预设类型
export type LuminancePreset =
    | 'default'
    | 'enhanceShadows'
    | 'enhanceHighlights'
    | 'popColors'
    | 'contrastBoost'
    | 'warmTones'
    | 'coolTones';

// 预设项类型定义
export interface LuminancePresetItem {
    name: string;
    params: LuminanceAdjustmentParams;
}

// 预设集合类型定义
export type LuminancePresets = Record<LuminancePreset, LuminancePresetItem>;


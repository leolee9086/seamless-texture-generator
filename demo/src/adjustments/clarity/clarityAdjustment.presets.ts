/**
 * 清晰度调整预设配置
 */
import type { ClarityParams, ClarityPresetsCollection } from './clarityAdjustment.types'
//@AIDONE 需要整理为模块,参考其它调整模块 - 已完成: 创建了clarity模块目录,包含index.ts/imports.ts/types.ts/presets.ts/clarityAdjustment.ts
/** 默认清晰度参数 */
export const 默认清晰度参数: ClarityParams = {
    sigma: 8.0,
    epsilon: 0.04,
    radius: 8,
    blockSize: 16,
    detailStrength: 2.0,
    enhancementStrength: 1.0,
    macroEnhancement: 0.0,
    contrastBoost: 1.2
}

/** 清晰度预设集合 */
export const 清晰度预设: ClarityPresetsCollection = {
    subtle: {
        name: '轻微',
        params: {
            sigma: 6.0,
            epsilon: 0.03,
            radius: 6,
            blockSize: 16,
            detailStrength: 1.5,
            enhancementStrength: 0.8,
            macroEnhancement: 0.0,
            contrastBoost: 1.1
        }
    },
    moderate: {
        name: '适中',
        params: {
            sigma: 8.0,
            epsilon: 0.04,
            radius: 8,
            blockSize: 16,
            detailStrength: 2.0,
            enhancementStrength: 1.0,
            macroEnhancement: 0.0,
            contrastBoost: 1.2
        }
    },
    strong: {
        name: '强烈',
        params: {
            sigma: 10.0,
            epsilon: 0.05,
            radius: 10,
            blockSize: 16,
            detailStrength: 3.0,
            enhancementStrength: 1.5,
            macroEnhancement: 0.2,
            contrastBoost: 1.4
        }
    },
    aggressive: {
        name: '激进',
        params: {
            sigma: 12.0,
            epsilon: 0.06,
            radius: 12,
            blockSize: 16,
            detailStrength: 4.0,
            enhancementStrength: 2.0,
            macroEnhancement: 0.3,
            contrastBoost: 1.6
        }
    }
}

// 提供英文别名导出，保持向后兼容
export const DEFAULT_CLARITY_PARAMS = 默认清晰度参数
export const CLARITY_PRESETS = 清晰度预设

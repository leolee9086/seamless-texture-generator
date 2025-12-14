/**
 * 清晰度调整相关类型定义
 */

/** 清晰度调整参数接口 */
export interface ClarityParams {
    /** 滤波强度 [1.0, 16.0] */
    sigma: number
    /** 正则化参数 [0.01, 0.1] */
    epsilon: number
    /** 窗口半径 [4, 32] */
    radius: number
    /** 线程组大小 [8, 32] */
    blockSize: number
    /** 细节强度 [0.1, 20.0] */
    detailStrength: number
    /** 增强强度 [0.1, 10.0] */
    enhancementStrength: number
    /** 宏观增强 [0.0, 2.0] */
    macroEnhancement: number
    /** 对比度增强 [1.0, 3.0] */
    contrastBoost: number
}

/** 清晰度预设配置项 */
export interface ClarityPresetConfig {
    /** 预设名称 */
    name: string
    /** 预设参数 */
    params: ClarityParams
}

/** 清晰度预设集合类型 */
export interface ClarityPresetsCollection {
    subtle: ClarityPresetConfig
    moderate: ClarityPresetConfig
    strong: ClarityPresetConfig
    aggressive: ClarityPresetConfig
}

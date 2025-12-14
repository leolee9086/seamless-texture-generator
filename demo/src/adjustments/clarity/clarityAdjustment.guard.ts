/**
 * 清晰度调整类型守卫
 */
import type { ClarityParams } from './clarityAdjustment.types'

/**
 * 验证清晰度参数是否有效
 * @param params 待验证的参数
 * @returns 参数是否符合ClarityParams类型
 */
export function isClarityParams(params: Partial<ClarityParams>): params is ClarityParams {
    return (
        typeof params.sigma === 'number' && params.sigma >= 1.0 && params.sigma <= 16.0 &&
        typeof params.epsilon === 'number' && params.epsilon >= 0.01 && params.epsilon <= 0.1 &&
        typeof params.radius === 'number' && params.radius >= 4 && params.radius <= 32 &&
        typeof params.blockSize === 'number' && params.blockSize >= 8 && params.blockSize <= 32 &&
        typeof params.detailStrength === 'number' && params.detailStrength >= 0.1 && params.detailStrength <= 20.0 &&
        typeof params.enhancementStrength === 'number' && params.enhancementStrength >= 0.1 && params.enhancementStrength <= 10.0 &&
        typeof params.macroEnhancement === 'number' && params.macroEnhancement >= 0.0 && params.macroEnhancement <= 2.0 &&
        typeof params.contrastBoost === 'number' && params.contrastBoost >= 1.0 && params.contrastBoost <= 3.0
    )
}

// 兼容性别名
export const validateClarityParams = isClarityParams

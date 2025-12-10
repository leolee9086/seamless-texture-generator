import type { ClarityParams } from './imports'

/**
 * 清晰度参数键的类型守卫
 * @param key 参数键
 * @returns 是否为有效的 ClarityParams 键
 */
export function isValidClarityParamKey(key: string): key is keyof ClarityParams {
    const validKeys: (keyof ClarityParams)[] = [
        'sigma',
        'epsilon', 
        'radius',
        'blockSize',
        'detailStrength',
        'enhancementStrength',
        'macroEnhancement',
        'contrastBoost'
    ]
    return validKeys.includes(key as keyof ClarityParams)
}
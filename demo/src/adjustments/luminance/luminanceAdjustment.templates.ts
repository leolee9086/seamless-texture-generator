/**
 * Luminance Adjustment - Text Templates
 * 存放所有与亮度调整相关的文本模板、错误消息等
 */

/**
 * 验证错误消息模板
 */
export const 验证错误消息 = {
    /** Zone参数验证消息 */
    zone参数: {
        brightness超出范围: (zone: string) => `${zone} brightness must be between -1.0 and 1.0`,
        contrast超出范围: (zone: string) => `${zone} contrast must be between -1.0 and 1.0`,
        saturation超出范围: (zone: string) => `${zone} saturation must be between -1.0 and 1.0`,
        red超出范围: (zone: string) => `${zone} red must be between -1.0 and 1.0`,
        green超出范围: (zone: string) => `${zone} green must be between -1.0 and 1.0`,
        blue超出范围: (zone: string) => `${zone} blue must be between -1.0 and 1.0`,
    },

    /** 范围参数验证消息 */
    范围参数: {
        shadowEnd超出范围: 'shadowEnd must be between 0.0 and 1.0',
        highlightStart超出范围: 'highlightStart must be between 0.0 and 1.0',
        shadowEnd必须小于highlightStart: 'shadowEnd must be less than highlightStart',
        softness超出范围: 'softness must be between 0.0 and 1.0',
    }
} as const;

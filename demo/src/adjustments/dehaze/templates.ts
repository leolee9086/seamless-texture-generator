/** 
 * @简洁函数 错误消息格式化工具函数，统一处理去雾失败时的错误信息格式 
 */
export const dehazeFailed = (error: unknown): string => {
  return `去雾处理失败: ${error instanceof Error ? error.message : String(error)}`
}

/**
 * 去雾参数验证错误消息模板
 */
export const DEHAZE_VALIDATION_ERROR_MESSAGES = {
  OMEGA_RANGE: '去雾强度(omega)必须在0.1-0.99之间',
  T0_RANGE: '最小透射率阈值(t0)必须在0.01-0.3之间',
  WINDOW_SIZE_RANGE: '暗通道窗口大小必须是3-31之间的奇数',
  TOP_RATIO_RANGE: '大气光估计比例必须在0.01-0.5之间',
  ADAPTIVE_STRENGTH_RANGE: '自适应调整强度必须在0.1-2.0之间',
  HAZE_WEIGHT_RANGE: '雾强度权重必须在0.0-1.0之间',
  ATMOSPHERIC_WEIGHT_RANGE: '大气光权重必须在0.0-1.0之间',
  SATURATION_ENHANCEMENT_RANGE: '饱和度增强因子必须在0.0-2.0之间',
  CONTRAST_ENHANCEMENT_RANGE: '对比度增强因子必须在0.5-2.0之间',
  BRIGHTNESS_ENHANCEMENT_RANGE: '明度增强因子必须在0.5-2.0之间'
} as const;
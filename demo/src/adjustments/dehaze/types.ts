/**
 * 去雾调整参数接口
 */

export interface DehazeParams {
  /** 去雾强度 (0.1-0.99) */
  omega: number;
  /** 最小透射率阈值 (0.01-0.3) */
  t0: number;
  /** 暗通道窗口大小 (3-31) */
  windowSize: number;
  /** 大气光估计比例 (0.01-0.5) */
  topRatio: number;
  /** 是否启用自适应模式 */
  adaptiveMode: boolean;
  /** 是否启用空间自适应模式 */
  spatialAdaptiveMode: boolean;
  /** 自适应调整强度 (0.1-2.0) */
  adaptiveStrength: number;
  /** 雾强度权重 (0.0-1.0) */
  hazeWeight: number;
  /** 大气光权重 (0.0-1.0) */
  atmosphericWeight: number;
  /** 是否启用增强功能 */
  enableEnhancement: boolean;
  /** 饱和度增强因子 (0.0-2.0) */
  saturationEnhancement: number;
  /** 对比度增强因子 (0.5-2.0) */
  contrastEnhancement: number;
  /** 明度增强因子 (0.5-2.0) */
  brightnessEnhancement: number;
}

/**
 * 去雾预设类型
 */
export type DehazePreset = 'light' | 'medium' | 'heavy' | 'adaptive' | 'spatialAdaptive' | 'enhanced' | 'default'

/**
 * 参数验证规则接口
 */
export interface ValidationRule {
  /** 验证函数，返回true表示验证通过 */
  validate: (value: number) => boolean;
  /** 错误消息 */
  errorMessage: string;
}

/**
 * 参数验证配置
 */
export interface ParamValidationConfig {
  [key: string]: ValidationRule;
}


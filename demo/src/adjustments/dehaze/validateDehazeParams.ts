import type { DehazeParams, ValidationRule, ParamValidationConfig } from './types';
import { DEHAZE_VALIDATION_ERROR_MESSAGES } from './templates';
import { getParamValue } from './validateDehazeParams.guard';

/**
 * 通用参数验证函数
 * @param value 参数值
 * @param rule 验证规则
 * @returns 错误消息或null（验证通过）
 */
function validateParam(value: number, rule: ValidationRule): string | null {
  return rule.validate(value) ? null : rule.errorMessage;
}

/**
 * 获取参数验证规则配置
 * @returns 参数验证配置对象
 */
function getValidationConfig(): ParamValidationConfig {
  return {
    omega: {
      validate: (value) => value >= 0.1 && value <= 0.99,
      errorMessage: DEHAZE_VALIDATION_ERROR_MESSAGES.OMEGA_RANGE
    },
    t0: {
      validate: (value) => value >= 0.01 && value <= 0.3,
      errorMessage: DEHAZE_VALIDATION_ERROR_MESSAGES.T0_RANGE
    },
    windowSize: {
      validate: (value) => value >= 3 && value <= 31 && value % 2 === 1,
      errorMessage: DEHAZE_VALIDATION_ERROR_MESSAGES.WINDOW_SIZE_RANGE
    },
    topRatio: {
      validate: (value) => value >= 0.01 && value <= 0.5,
      errorMessage: DEHAZE_VALIDATION_ERROR_MESSAGES.TOP_RATIO_RANGE
    },
    adaptiveStrength: {
      validate: (value) => value >= 0.1 && value <= 2.0,
      errorMessage: DEHAZE_VALIDATION_ERROR_MESSAGES.ADAPTIVE_STRENGTH_RANGE
    },
    hazeWeight: {
      validate: (value) => value >= 0.0 && value <= 1.0,
      errorMessage: DEHAZE_VALIDATION_ERROR_MESSAGES.HAZE_WEIGHT_RANGE
    },
    atmosphericWeight: {
      validate: (value) => value >= 0.0 && value <= 1.0,
      errorMessage: DEHAZE_VALIDATION_ERROR_MESSAGES.ATMOSPHERIC_WEIGHT_RANGE
    },
    saturationEnhancement: {
      validate: (value) => value >= 0.0 && value <= 2.0,
      errorMessage: DEHAZE_VALIDATION_ERROR_MESSAGES.SATURATION_ENHANCEMENT_RANGE
    },
    contrastEnhancement: {
      validate: (value) => value >= 0.5 && value <= 2.0,
      errorMessage: DEHAZE_VALIDATION_ERROR_MESSAGES.CONTRAST_ENHANCEMENT_RANGE
    },
    brightnessEnhancement: {
      validate: (value) => value >= 0.5 && value <= 2.0,
      errorMessage: DEHAZE_VALIDATION_ERROR_MESSAGES.BRIGHTNESS_ENHANCEMENT_RANGE
    }
  };
}

/**
 * 验证单个参数
 * @param params 参数对象
 * @param paramName 参数名
 * @param validationConfig 验证配置
 * @returns 错误消息或null
 */
function validateSingleParam(
  params: Partial<DehazeParams>,
  paramName: string,
  validationConfig: ParamValidationConfig
): string | null {
  const paramValue = getParamValue(params, paramName);
  return paramValue !== null
    ? validateParam(paramValue, validationConfig[paramName])
    : null;
}

/**
 * 验证去雾参数
 * @param params 去雾参数
 * @returns 验证结果
 */
export function validateDehazeParams(params: Partial<DehazeParams>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const validationConfig = getValidationConfig();
  
  // 使用for...of循环遍历所有参数进行验证
  for (const paramName of Object.keys(validationConfig)) {
    const error = validateSingleParam(params, paramName, validationConfig);
    error && errors.push(error);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
export const BasicParamsUIDefine = [
  {
    id: 'omega',
    label: '去雾强度',
    min: 0.1,
    max: 0.99,
    step: 0.01,
    gradient: 'linear-gradient(90deg, #007aff 0%, #5ac8fa 50%, #ffffff 100%)',
    showRuler: true
  },
  {
    id: 't0',
    label: '透射率阈值',
    min: 0.01,
    max: 0.3,
    step: 0.01,
    gradient: 'linear-gradient(90deg, #ff3b30 0%, #ffcc00 50%, #4cd964 100%)',
    showRuler: true
  },
  {
    id: 'windowSize',
    label: '窗口大小',
    min: 0,
    max: 31,
    step: 1,
    gradient: 'linear-gradient(90deg, #5856d6 0%, #af52de 100%)',
    showRuler: true
  }
]

export const AdvancedParamsUIDefine = [
  {
    id: 'topRatio',
    label: '大气光比例',
    min: 0.01,
    max: 0.5,
    step: 0.01,
    gradient: 'linear-gradient(90deg, #ff9500 0%, #ffcc00 100%)',
    showRuler: true
  },
  {
    id: 'adaptiveStrength',
    label: '自适应强度',
    min: 0.1,
    max: 2.0,
    step: 0.01,
    gradient: 'linear-gradient(90deg, #34c759 0%, #30d158 100%)',
    showRuler: true
  },
  {
    id: 'hazeWeight',
    label: '雾强度权重',
    min: 0.0,
    max: 1.0,
    step: 0.01,
    gradient: 'linear-gradient(90deg, #007aff 0%, #5ac8fa 100%)',
    showRuler: true
  },
  {
    id: 'atmosphericWeight',
    label: '大气光权重',
    min: 0.0,
    max: 1.0,
    step: 0.01,
    gradient: 'linear-gradient(90deg, #ff2d55 0%, #ff3b30 100%)',
    showRuler: true
  }
]

export const EnhancementParamsUIDefine = [
  {
    id: 'saturationEnhancement',
    label: '饱和度增强',
    min: 0.0,
    max: 2.0,
    step: 0.01,
    gradient: 'linear-gradient(90deg, #888 0%, #ff0000 100%)',
    showRuler: true
  },
  {
    id: 'contrastEnhancement',
    label: '对比度增强',
    min: 0.5,
    max: 2.0,
    step: 0.01,
    gradient: 'linear-gradient(90deg, #000 0%, #fff 100%)',
    showRuler: true
  },
  {
    id: 'brightnessEnhancement',
    label: '明度增强',
    min: 0.5,
    max: 2.0,
    step: 0.01,
    gradient: 'linear-gradient(90deg, #000 0%, #888 50%, #fff 100%)',
    showRuler: true
  }
]

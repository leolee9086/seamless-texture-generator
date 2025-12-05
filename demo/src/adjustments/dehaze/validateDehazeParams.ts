import { DehazeParams } from './types';

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

  if (params.omega !== undefined) {
    if (params.omega < 0.1 || params.omega > 0.99) {
      errors.push('去雾强度(omega)必须在0.1-0.99之间');
    }
  }

  if (params.t0 !== undefined) {
    if (params.t0 < 0.01 || params.t0 > 0.3) {
      errors.push('最小透射率阈值(t0)必须在0.01-0.3之间');
    }
  }

  if (params.windowSize !== undefined) {
    if (params.windowSize < 0 || params.windowSize > 31 || params.windowSize % 2 === 0) {
      errors.push('暗通道窗口大小必须是3-31之间的奇数');
    }
  }

  if (params.topRatio !== undefined) {
    if (params.topRatio < 0.01 || params.topRatio > 0.5) {
      errors.push('大气光估计比例必须在0.01-0.5之间');
    }
  }

  if (params.adaptiveStrength !== undefined) {
    if (params.adaptiveStrength < 0.1 || params.adaptiveStrength > 2.0) {
      errors.push('自适应调整强度必须在0.1-2.0之间');
    }
  }

  if (params.hazeWeight !== undefined) {
    if (params.hazeWeight < 0.0 || params.hazeWeight > 1.0) {
      errors.push('雾强度权重必须在0.0-1.0之间');
    }
  }

  if (params.atmosphericWeight !== undefined) {
    if (params.atmosphericWeight < 0.0 || params.atmosphericWeight > 1.0) {
      errors.push('大气光权重必须在0.0-1.0之间');
    }
  }

  if (params.saturationEnhancement !== undefined) {
    if (params.saturationEnhancement < 0.0 || params.saturationEnhancement > 2.0) {
      errors.push('饱和度增强因子必须在0.0-2.0之间');
    }
  }

  if (params.contrastEnhancement !== undefined) {
    if (params.contrastEnhancement < 0.5 || params.contrastEnhancement > 2.0) {
      errors.push('对比度增强因子必须在0.5-2.0之间');
    }
  }

  if (params.brightnessEnhancement !== undefined) {
    if (params.brightnessEnhancement < 0.5 || params.brightnessEnhancement > 2.0) {
      errors.push('明度增强因子必须在0.5-2.0之间');
    }
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

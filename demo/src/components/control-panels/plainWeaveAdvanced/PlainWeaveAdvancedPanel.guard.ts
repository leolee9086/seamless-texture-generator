import { PLAIN_WEAVE_PANEL_TYPES, PLAIN_WEAVE_PANEL_VALIDATION_ERRORS } from './PlainWeaveAdvancedPanel.constants'
import type { PlainWeaveAdvancedParams as PlainWeaveParams } from './PlainWeaveAdvancedPanel.types'

/**
 * 安全获取 isGenerating 属性
 */
export const getSafeIsGenerating = (props: Record<string, unknown>): boolean => {
  const value = props.isGenerating
  if (typeof value === PLAIN_WEAVE_PANEL_TYPES.BOOLEAN) {
    return value as boolean
  }
  console.warn(PLAIN_WEAVE_PANEL_VALIDATION_ERRORS.IS_GENERATING_BOOLEAN)
  return false
}

/**
 * 验证 PlainWeavePanelProps
 */
export const validatePlainWeavePanelProps = (props: Record<string, unknown> | { isGenerating: boolean }): string | true => {
  if (typeof props.isGenerating !== PLAIN_WEAVE_PANEL_TYPES.BOOLEAN) {
    return PLAIN_WEAVE_PANEL_VALIDATION_ERRORS.IS_GENERATING_BOOLEAN
  }
  return true
}

/**
 * 验证滑块更新数据
 */
export const validateSliderUpdateData = (data: unknown): string | true => {
  if (!data || typeof data !== 'object') {
    return 'Slider update data must be an object'
  }

  const sliderData = data as { id?: unknown; value?: unknown }

  if (typeof sliderData.id !== PLAIN_WEAVE_PANEL_TYPES.STRING) {
    return 'Slider update data must have an id property of type string'
  }

  if (typeof sliderData.value !== PLAIN_WEAVE_PANEL_TYPES.NUMBER) {
    return 'Slider update data must have a value property of type number'
  }

  return true
}

/**
 * 验证预设数据
 */
export const validatePresetData = (preset: unknown): string | true => {
  if (!preset || typeof preset !== 'object') {
    return 'Preset must be an object'
  }

  return true
}

/**
 * 验证图片数据
 */
export const validateImageData = (imageData: unknown): string | true => {
  if (typeof imageData !== PLAIN_WEAVE_PANEL_TYPES.STRING) {
    return 'Image data must be a string'
  }

  return true
}

/**
 * 检查是否为有效的平纹织物参数键
 */
export const isValidPlainWeaveParamKey = (key: string): key is keyof PlainWeaveParams => {
  const validKeys: (keyof PlainWeaveParams)[] = [
    'tileSize',
    'warpDensity',
    'weftDensity',
    'warpColor',
    'weftColor',
    'threadThickness',
    'threadTwist',
    'fiberDetail',
    'fuzziness',
    'weaveTightness',
    'threadUnevenness',
    'weaveImperfection',
    'fbmOctaves',
    'fbmAmplitude',
    'noiseFrequency',
    'colorVariation',
    'threadHeightScale',
    'threadShadowStrength',
    'warpSheen',
    'weftSheen',
    'normalStrength',
    'roughnessMin',
    'roughnessMax'
  ]

  return validKeys.includes(key as keyof PlainWeaveParams)
}

/**
 * 检查是否为数字类型的平纹织物参数键
 */
export const isNumericPlainWeaveParamKey = (key: string | number | symbol): boolean => {
  if (typeof key !== 'string') {
    return false
  }
  const numericKeys: string[] = [
    'tileSize',
    'warpDensity',
    'weftDensity',
    'threadThickness',
    'threadTwist',
    'fiberDetail',
    'fuzziness',
    'weaveTightness',
    'threadUnevenness',
    'weaveImperfection',
    'fbmOctaves',
    'fbmAmplitude',
    'noiseFrequency',
    'colorVariation',
    'threadHeightScale',
    'threadShadowStrength',
    'warpSheen',
    'weftSheen',
    'normalStrength',
    'roughnessMin',
    'roughnessMax'
  ]

  return numericKeys.includes(key)
}

/**
 * 检查是否为有效的图片数据参数
 * @简洁函数 用于类型守卫的简单检查
 */
export const isValidImageDataArg = (args: unknown[]): args is [string] => {
  return args.length === 1 && typeof args[0] === 'string'
}
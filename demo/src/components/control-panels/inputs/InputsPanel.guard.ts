import { INPUTS_PANEL_DEFAULTS } from './InputsPanel.constants'
import type { SliderItem } from './imports'

/**
 * 类型守卫函数，用于安全的类型检查和转换
 */

/**
 * 检查是否为有效的布尔值
 */
export const isValidBoolean = (value: unknown): value is boolean => {
  return typeof value === 'boolean'
}

/**
 * 检查是否为有效的字符串或null
 */
export const isValidStringOrNull = (value: unknown): value is string | null => {
  return value === null || typeof value === 'string'
}

/**
 * 检查是否为有效的滑块项数组
 */
export const isValidSliderItems = (value: unknown): value is SliderItem[] => {
  return Array.isArray(value)
}

/**
 * 安全地从父级上下文获取 isMobile 值
 */
export const getSafeIsMobile = (props: Record<string, unknown>): boolean => {
  const value = props.isMobile
  return value === undefined ? INPUTS_PANEL_DEFAULTS.IS_MOBILE : (isValidBoolean(value) ? value : false)
}

/**
 * 安全地从父级上下文获取 isProcessing 值
 */
export const getSafeIsProcessing = (props: Record<string, unknown>): boolean => {
  const value = props.isProcessing
  return isValidBoolean(value) ? value : false
}

/**
 * 安全地从父级上下文获取 originalImage 值
 */
export const getSafeOriginalImage = (props: Record<string, unknown>): string | null => {
  const value = props.originalImage
  return isValidStringOrNull(value) ? value : null
}

/**
 * 安全地从父级上下文获取 inputSliderItems 值
 */
export const getSafeInputSliderItems = (props: Record<string, unknown>): SliderItem[] => {
  const value = props.inputSliderItems
  return isValidSliderItems(value) ? value : []
}
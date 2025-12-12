/**
 * SecureApiKeyInput 相关类型守卫
 */

import type { Ref, ComputedRef } from './imports'
import type { InputMode, FilePickerOptions, FilePickerAcceptType } from './SecureApiKeyInput.types'
import { FILE_PICKER_OPTIONS, FILE_EXTENSION_PREFIX } from './SecureApiKeyInput.constants'



// 类型检查常量
export const TYPE_CHECK_CONSTANTS = {
  OBJECT: 'object',
  BOOLEAN: 'boolean',
  STRING: 'string',
} as const

/**
 * 检查是否为有效的 InputMode
 */
export function isValidInputMode(value: unknown): value is InputMode {
  return value === 'file' || value === 'temp'
}

/**
 * 检查是否为有效的 Ref<InputMode>
 */
export function isInputModeRef(ref: unknown): ref is Ref<InputMode> {
  return typeof ref === 'object' && ref !== null && 'value' in ref
}

/**
 * 检查是否为有效的 Ref<string>
 */
export function isStringRef(ref: unknown): ref is Ref<string> {
  return typeof ref === 'object' && ref !== null && 'value' in ref
}

/**
 * 检查是否为有效的 ComputedRef<boolean>
 */
export function isBooleanComputedRef(ref: unknown): ref is ComputedRef<boolean> {
  return typeof ref === 'object' && ref !== null && 'value' in ref
}

/**
 * 检查是否为有效的 HTMLInputElement
 */
export function isHTMLInputElement(element: unknown): element is HTMLInputElement {
  return element instanceof HTMLInputElement
}

/**
 * 检查对象是否为有效的 FilePickerOptions
 */
export function isValidFilePickerOptions(obj: unknown): obj is FilePickerOptions {
  if (!obj || typeof obj !== TYPE_CHECK_CONSTANTS.OBJECT) {
    return false
  }

  const options = obj as Record<string, unknown>
  
  // 检查 multiple 属性
  if (options.multiple !== undefined && typeof options.multiple !== TYPE_CHECK_CONSTANTS.BOOLEAN) {
    return false
  }
  
  // 检查 types 属性
  if (options.types !== undefined && (!Array.isArray(options.types) || !isValidTypesArray(options.types))) {
    return false
  }
  
  return true
}

/**
 * 检查 types 数组是否有效
 */
function isValidTypesArray(types: unknown[]): types is FilePickerAcceptType[] {
  for (const type of types) {
    if (!type || typeof type !== TYPE_CHECK_CONSTANTS.OBJECT) {
      return false
    }
    
    const typeObj = type as Record<string, unknown>
    
    // 检查 description
    if (typeObj.description !== undefined && typeof typeObj.description !== TYPE_CHECK_CONSTANTS.STRING) {
      return false
    }
    
    // 检查 accept
    if (!typeObj.accept || typeof typeObj.accept !== TYPE_CHECK_CONSTANTS.OBJECT || !isValidAcceptObject(typeObj.accept)) {
      return false
    }
  }
  
  return true
}

/**
 * 检查 accept 对象是否有效
 */
function isValidAcceptObject(accept: unknown): accept is Record<`${string}/${string}`, `.${string}` | `.${string}`[]> {
  const acceptObj = accept as Record<string, unknown>
  for (const mimeType in acceptObj) {
    const value = acceptObj[mimeType]
    
    if (Array.isArray(value)) {
      for (const extension of value) {
        if (typeof extension !== TYPE_CHECK_CONSTANTS.STRING || !extension.startsWith(FILE_EXTENSION_PREFIX)) {
          return false
        }
      }
      continue
    }
    
    if (typeof value !== TYPE_CHECK_CONSTANTS.STRING || !(value as string).startsWith(FILE_EXTENSION_PREFIX)) {
      return false
    }
  }
  
  return true
}

/**
 * 获取类型安全的文件选择器选项
 */
export function getFilePickerOptions(): FilePickerOptions {
  if (isValidFilePickerOptions(FILE_PICKER_OPTIONS)) {
    return FILE_PICKER_OPTIONS
  }
  
  // 如果验证失败，返回基本配置
  return {
    types: [
      {
        description: 'API Key File',
        accept: { 'text/plain': ['.txt', '.key', '.pem'] },
      },
    ],
    multiple: false,
  }
}
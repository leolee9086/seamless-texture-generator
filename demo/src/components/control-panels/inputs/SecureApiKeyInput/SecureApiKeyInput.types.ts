/**
 * SecureApiKeyInput 组件和 SecureKeyManager 相关类型定义
 */

import type { Ref, ComputedRef } from './imports'


export type KeyRequestFunction<T> = (apiKey: string) => Promise<T>

// SecureApiKeyInput 组件类型
export interface SecureApiKeyInputEmits {
  (e: 'update:modelValue', value: string): void
  (e: 'key-ready', hasKey: boolean): void
  (e: 'key-cleared'): void
}

export interface SecureApiKeyInputProps {
  modelValue?: string
  isMobile?: boolean
}

export interface SecureApiKeyInputState {
  // 状态
  inputMode: Ref<'file' | 'temp'>
  fileName: Ref<string>
  tempApiKey: Ref<string>
  hasKeyFile: ComputedRef<boolean>
  hasTempKey: ComputedRef<boolean>
  hasAnyKey: ComputedRef<boolean>
}

export interface SecureApiKeyInputActions {
  // 方法
  selectKeyFile: () => Promise<void>
  clearKeyFile: () => void
  setInputMode: (mode: 'file' | 'temp') => void
  handleTempKeyChange: () => void
}



export type InputMode = 'file' | 'temp'

export interface UseSecureApiKeyInputParams {
  isMobile?: boolean
  onKeyReady?: (hasKey: boolean) => void
  onKeyCleared?: () => void
}

export interface UseSecureApiKeyInputReturn {
  state: SecureApiKeyInputState
  actions: SecureApiKeyInputActions
}

/**
 * 密钥状态通知参数
 */
export interface NotifyKeyStatusParams {
  mode: InputMode
  hasKeyFile: ComputedRef<boolean>
  hasTempKey: ComputedRef<boolean>
  onKeyReady?: (hasKey: boolean) => void
}

// File System Access API 类型定义
export interface FilePickerAcceptType {
  description?: string
  accept: Record<`${string}/${string}`, `.${string}` | `.${string}`[]>
}

export interface FilePickerOptions {
  types?: FilePickerAcceptType[]
  multiple?: boolean
  excludeAcceptAllOption?: boolean
}